import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

import { apiService } from '../services/api';
import { websocketService } from '../services/websocket';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  jobId?: string;
  error?: string;
}

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const response = await apiService.uploadFile(uploadFile.file);

      clearInterval(progressInterval);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                jobId: response.job_id,
              }
            : f
        )
      );

      // Listen for processing updates via WebSocket
      const handleProcessingEvent = (event: any) => {
        if (event.data.job_id === response.job_id) {
          setFiles((prev) =>
            prev.map((f) =>
              f.jobId === response.job_id
                ? {
                    ...f,
                    progress: event.data.progress || f.progress,
                  }
                : f
            )
          );
        }
      };

      websocketService.on('processing_event', handleProcessingEvent);

      // Clean up listener after some time
      setTimeout(() => {
        websocketService.off('processing_event', handleProcessingEvent);
      }, 300000); // 5 minutes

    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return <UploadIcon color="primary" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        File Upload
      </Typography>

      {/* Drag and Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the PDF files here...'
            : 'Drag & drop PDF files here, or click to select'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Supports multiple PDF files
        </Typography>
      </Paper>

      {/* Upload Controls */}
      {files.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={uploadAllFiles}
            disabled={isUploading || files.every((f) => f.status !== 'pending')}
          >
            Upload All Files
          </Button>
          <Button
            variant="outlined"
            onClick={() => setFiles([])}
            disabled={isUploading}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Files ({files.length})
          </Typography>
          <List>
            {files.map((uploadFile) => (
              <ListItem key={uploadFile.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getStatusIcon(uploadFile.status)}
                </Box>
                <ListItemText
                  primary={uploadFile.file.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Size: {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip
                          label={uploadFile.status}
                          color={getStatusColor(uploadFile.status) as any}
                          size="small"
                        />
                        {uploadFile.jobId && (
                          <Chip
                            label={`Job: ${uploadFile.jobId}`}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                      {uploadFile.status === 'uploading' && (
                        <LinearProgress
                          variant="determinate"
                          value={uploadFile.progress}
                          sx={{ mt: 1 }}
                        />
                      )}
                      {uploadFile.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {uploadFile.error}
                        </Alert>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={uploadFile.status === 'uploading'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Instructions */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Typography variant="body2" paragraph>
          • Upload PDF files containing football match data
        </Typography>
        <Typography variant="body2" paragraph>
          • Files will be automatically processed after upload
        </Typography>
        <Typography variant="body2" paragraph>
          • You can monitor processing progress in real-time
        </Typography>
        <Typography variant="body2">
          • Processed data will be available in the Reports section
        </Typography>
      </Paper>
    </Box>
  );
};

export default FileUpload;