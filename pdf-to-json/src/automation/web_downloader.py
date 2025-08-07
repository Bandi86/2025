"""
WebDownloader for automatic PDF fetching from web sources.

This module provides the WebDownloader class that handles automatic downloading
of PDF files from web sources with features like conditional requests, resume
capability, rate limiting, and comprehensive error handling.
"""

import asyncio
import hashlib
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, urljoin

import aiofiles
import aiohttp
from aiohttp import ClientSession, ClientTimeout, ClientError

from .config import WebDownloaderConfig
from .exceptions import AutomationConfigError


logger = logging.getLogger(__name__)


@dataclass
class FileInfo:
    """Information about a remote file."""
    url: str
    filename: str
    size: Optional[int] = None
    last_modified: Optional[str] = None
    etag: Optional[str] = None
    content_type: Optional[str] = None
    checksum: Optional[str] = None


@dataclass
class DownloadResult:
    """Result of a download operation."""
    success: bool
    file_path: Optional[Path] = None
    file_info: Optional[FileInfo] = None
    bytes_downloaded: int = 0
    error_message: Optional[str] = None
    was_resumed: bool = False
    was_cached: bool = False
    download_time: float = 0.0


class WebDownloader:
    """
    WebDownloader handles automatic PDF fetching from web sources.
    
    Features:
    - HTTP/HTTPS support with custom headers
    - Conditional requests (If-Modified-Since, ETag)
    - Resume capability for interrupted downloads
    - Rate limiting and exponential backoff
    - Checksum verification
    - Comprehensive error handling and logging
    """
    
    def __init__(self, config: WebDownloaderConfig):
        """
        Initialize WebDownloader with configuration.
        
        Args:
            config: WebDownloaderConfig instance
        """
        self.config = config
        self.session: Optional[ClientSession] = None
        self.last_request_time = 0.0
        self._download_stats = {
            'total_downloads': 0,
            'successful_downloads': 0,
            'failed_downloads': 0,
            'bytes_downloaded': 0,
            'cache_hits': 0
        }
        
        # Ensure download directory exists
        Path(self.config.download_path).mkdir(parents=True, exist_ok=True)
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self._create_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self._close_session()
    
    async def _create_session(self) -> None:
        """Create HTTP client session with proper configuration."""
        if self.session and not self.session.closed:
            return
        
        # Configure timeout
        timeout = ClientTimeout(total=self.config.timeout)
        
        # Configure headers
        headers = {
            'User-Agent': self.config.user_agent,
            **self.config.headers
        }
        
        # Create connector with SSL verification setting
        connector = aiohttp.TCPConnector(
            verify_ssl=self.config.verify_ssl,
            limit=10,  # Connection pool limit
            limit_per_host=5
        )
        
        self.session = ClientSession(
            timeout=timeout,
            headers=headers,
            connector=connector
        )
        
        logger.debug("HTTP session created with timeout=%s, verify_ssl=%s", 
                    self.config.timeout, self.config.verify_ssl)
    
    async def _close_session(self) -> None:
        """Close HTTP client session."""
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None
            logger.debug("HTTP session closed")
    
    async def _rate_limit(self) -> None:
        """Apply rate limiting between requests."""
        if self.config.rate_limit_delay <= 0:
            return
        
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.config.rate_limit_delay:
            sleep_time = self.config.rate_limit_delay - time_since_last
            logger.debug("Rate limiting: sleeping for %.2f seconds", sleep_time)
            await asyncio.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    async def check_for_new_files(self) -> List[FileInfo]:
        """
        Check for new files available for download.
        
        Returns:
            List of FileInfo objects for available files
            
        Raises:
            Exception: If checking fails after all retries
        """
        if not self.session:
            await self._create_session()
        
        for attempt in range(self.config.max_retries + 1):
            try:
                await self._rate_limit()
                
                logger.info("Checking for new files at %s (attempt %d/%d)", 
                           self.config.url, attempt + 1, self.config.max_retries + 1)
                
                async with self.session.head(self.config.url) as response:
                    if response.status == 200:
                        file_info = await self._extract_file_info(response, self.config.url)
                        return [file_info] if file_info else []
                    else:
                        logger.warning("HEAD request failed with status %d", response.status)
                        if response.status == 404:
                            return []  # No files available
                        
            except Exception as e:
                logger.warning("Attempt %d failed: %s", attempt + 1, str(e))
                if attempt < self.config.max_retries:
                    wait_time = self._calculate_backoff_delay(attempt)
                    logger.info("Retrying in %.2f seconds...", wait_time)
                    await asyncio.sleep(wait_time)
                else:
                    logger.error("All attempts failed to check for new files")
                    raise
        
        return []
    
    async def get_latest_file_info(self) -> Optional[FileInfo]:
        """
        Get information about the latest file available for download.
        
        Returns:
            FileInfo object or None if no file is available
        """
        try:
            files = await self.check_for_new_files()
            return files[0] if files else None
        except Exception as e:
            logger.error("Failed to get latest file info: %s", str(e))
            return None
    
    def is_file_newer(self, remote_file: FileInfo, local_file: Path) -> bool:
        """
        Check if remote file is newer than local file.
        
        Args:
            remote_file: FileInfo object for remote file
            local_file: Path to local file
            
        Returns:
            True if remote file is newer or local file doesn't exist
        """
        if not local_file.exists():
            return True
        
        # Check by last modified time
        if remote_file.last_modified:
            try:
                local_mtime = local_file.stat().st_mtime
                # Convert remote time to timestamp for comparison
                # This is a simplified comparison - in practice you'd parse the HTTP date
                return True  # For now, assume remote is newer if we have last_modified
            except Exception as e:
                logger.warning("Failed to compare modification times: %s", str(e))
        
        # Check by ETag if available
        if remote_file.etag:
            local_etag = self._get_local_etag(local_file)
            if local_etag and local_etag != remote_file.etag:
                return True
            elif not local_etag:  # No local ETag means we should check
                return True
        
        # Check by file size
        if remote_file.size:
            try:
                local_size = local_file.stat().st_size
                if local_size != remote_file.size:
                    return True
            except OSError:
                return True  # File access error, assume newer
        
        # If we have last_modified, assume newer (simplified logic)
        if remote_file.last_modified:
            return True
        
        return False
    
    async def download_file(self, file_info: FileInfo) -> DownloadResult:
        """
        Download a file with resume capability and verification.
        
        Args:
            file_info: FileInfo object describing the file to download
            
        Returns:
            DownloadResult object with download status and details
        """
        start_time = time.time()
        self._download_stats['total_downloads'] += 1
        
        if not self.session:
            await self._create_session()
        
        # Determine local file path
        local_path = Path(self.config.download_path) / file_info.filename
        
        # Check if we can use conditional requests
        headers = {}
        resume_from = 0
        was_resumed = False
        
        if local_path.exists():
            if self.config.enable_conditional_requests:
                # Add conditional headers
                if file_info.last_modified:
                    headers['If-Modified-Since'] = file_info.last_modified
                if file_info.etag:
                    headers['If-None-Match'] = file_info.etag
            
            if self.config.enable_resume:
                # Check if we can resume
                resume_from = local_path.stat().st_size
                if resume_from > 0:
                    headers['Range'] = f'bytes={resume_from}-'
                    was_resumed = True
                    logger.info("Attempting to resume download from byte %d", resume_from)
        
        for attempt in range(self.config.max_retries + 1):
            try:
                await self._rate_limit()
                
                logger.info("Downloading %s to %s (attempt %d/%d)", 
                           file_info.url, local_path, attempt + 1, self.config.max_retries + 1)
                
                async with self.session.get(file_info.url, headers=headers) as response:
                    # Handle different response codes
                    if response.status == 304:  # Not Modified
                        logger.info("File not modified, using cached version")
                        self._download_stats['cache_hits'] += 1
                        return DownloadResult(
                            success=True,
                            file_path=local_path,
                            file_info=file_info,
                            was_cached=True,
                            download_time=time.time() - start_time
                        )
                    
                    if response.status == 206:  # Partial Content (resume)
                        logger.info("Resuming download from byte %d", resume_from)
                        mode = 'ab'  # Append binary
                    elif response.status == 200:  # OK
                        mode = 'wb'  # Write binary
                        resume_from = 0
                        was_resumed = False
                    else:
                        raise aiohttp.ClientResponseError(
                            request_info=response.request_info,
                            history=response.history,
                            status=response.status,
                            message=f"Unexpected status code: {response.status}"
                        )
                    
                    # Download file
                    bytes_downloaded = await self._download_content(
                        response, local_path, mode, resume_from
                    )
                    
                    # Verify download if checksum is available
                    if file_info.checksum:
                        if not await self._verify_checksum(local_path, file_info.checksum):
                            raise ValueError("Checksum verification failed")
                    
                    # Update statistics
                    self._download_stats['successful_downloads'] += 1
                    self._download_stats['bytes_downloaded'] += bytes_downloaded
                    
                    # Store metadata
                    await self._store_file_metadata(local_path, file_info)
                    
                    logger.info("Successfully downloaded %s (%d bytes)", 
                               local_path, bytes_downloaded)
                    
                    return DownloadResult(
                        success=True,
                        file_path=local_path,
                        file_info=file_info,
                        bytes_downloaded=bytes_downloaded,
                        was_resumed=was_resumed,
                        download_time=time.time() - start_time
                    )
                    
            except Exception as e:
                error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
                logger.warning("Download attempt %d failed: %s", attempt + 1, error_msg)
                if attempt < self.config.max_retries:
                    wait_time = self._calculate_backoff_delay(attempt)
                    logger.info("Retrying in %.2f seconds...", wait_time)
                    await asyncio.sleep(wait_time)
                else:
                    logger.error("All download attempts failed")
                    self._download_stats['failed_downloads'] += 1
                    return DownloadResult(
                        success=False,
                        error_message=error_msg,
                        download_time=time.time() - start_time
                    )
        
        # This should never be reached, but just in case
        return DownloadResult(
            success=False,
            error_message="Unknown error occurred",
            download_time=time.time() - start_time
        )
    
    async def _extract_file_info(self, response: aiohttp.ClientResponse, url: str) -> Optional[FileInfo]:
        """Extract file information from HTTP response headers."""
        try:
            # Extract filename from URL or Content-Disposition header
            filename = self._extract_filename(response, url)
            if not filename:
                logger.warning("Could not determine filename from %s", url)
                return None
            
            # Extract other metadata
            size = None
            if 'Content-Length' in response.headers:
                try:
                    size = int(response.headers['Content-Length'])
                except ValueError:
                    pass
            
            last_modified = response.headers.get('Last-Modified')
            etag = response.headers.get('ETag')
            content_type = response.headers.get('Content-Type')
            
            return FileInfo(
                url=url,
                filename=filename,
                size=size,
                last_modified=last_modified,
                etag=etag,
                content_type=content_type
            )
            
        except Exception as e:
            logger.error("Failed to extract file info: %s", str(e))
            return None
    
    def _extract_filename(self, response: aiohttp.ClientResponse, url: str) -> Optional[str]:
        """Extract filename from response or URL."""
        # Try Content-Disposition header first
        content_disposition = response.headers.get('Content-Disposition', '')
        if 'filename=' in content_disposition:
            try:
                filename = content_disposition.split('filename=')[1].strip('"\'')
                if filename:
                    return filename
            except (IndexError, AttributeError):
                pass
        
        # Fall back to URL path
        parsed_url = urlparse(url)
        filename = Path(parsed_url.path).name
        
        # If no extension, assume PDF
        if not filename or '.' not in filename:
            filename = f"download_{int(time.time())}.pdf"
        
        return filename
    
    async def _download_content(
        self, 
        response: aiohttp.ClientResponse, 
        local_path: Path, 
        mode: str,
        resume_from: int = 0
    ) -> int:
        """Download response content to file."""
        bytes_downloaded = 0
        
        async with aiofiles.open(local_path, mode) as f:
            async for chunk in response.content.iter_chunked(8192):  # 8KB chunks
                await f.write(chunk)
                bytes_downloaded += len(chunk)
        
        return bytes_downloaded
    
    async def _verify_checksum(self, file_path: Path, expected_checksum: str) -> bool:
        """Verify file checksum."""
        try:
            hasher = hashlib.sha256()
            async with aiofiles.open(file_path, 'rb') as f:
                async for chunk in self._read_chunks(f, 8192):
                    hasher.update(chunk)
            
            actual_checksum = hasher.hexdigest()
            return actual_checksum == expected_checksum
            
        except Exception as e:
            logger.error("Checksum verification failed: %s", str(e))
            return False
    
    async def _read_chunks(self, file, chunk_size: int):
        """Async generator for reading file chunks."""
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            yield chunk
    
    def _calculate_backoff_delay(self, attempt: int) -> float:
        """Calculate exponential backoff delay."""
        base_delay = 1.0
        max_delay = 60.0
        delay = min(base_delay * (2 ** attempt), max_delay)
        return delay
    
    def _get_local_etag(self, file_path: Path) -> Optional[str]:
        """Get stored ETag for local file."""
        metadata_path = file_path.with_suffix(file_path.suffix + '.meta')
        if metadata_path.exists():
            try:
                import json
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                return metadata.get('etag')
            except Exception:
                pass
        return None
    
    async def _store_file_metadata(self, file_path: Path, file_info: FileInfo) -> None:
        """Store file metadata for future reference."""
        metadata_path = file_path.with_suffix(file_path.suffix + '.meta')
        metadata = {
            'url': file_info.url,
            'filename': file_info.filename,
            'size': file_info.size,
            'last_modified': file_info.last_modified,
            'etag': file_info.etag,
            'content_type': file_info.content_type,
            'download_time': time.time()
        }
        
        try:
            import json
            async with aiofiles.open(metadata_path, 'w') as f:
                await f.write(json.dumps(metadata, indent=2))
        except Exception as e:
            logger.warning("Failed to store metadata: %s", str(e))
    
    def get_download_stats(self) -> Dict[str, Any]:
        """Get download statistics."""
        return self._download_stats.copy()
    
    def reset_stats(self) -> None:
        """Reset download statistics."""
        self._download_stats = {
            'total_downloads': 0,
            'successful_downloads': 0,
            'failed_downloads': 0,
            'bytes_downloaded': 0,
            'cache_hits': 0
        }