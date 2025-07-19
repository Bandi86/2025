import { Controller, Post, Get, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DataIngestionService } from './data-ingestion.service';

@Controller('data-ingestion')
export class DataIngestionController {
    private readonly logger = new Logger(DataIngestionController.name);

    constructor(private readonly dataIngestionService: DataIngestionService) { }

    @Post('ingest-file')
    async ingestFile(@Body('filePath') filePath: string) {
        try {
            if (!filePath) {
                throw new HttpException('File path is required', HttpStatus.BAD_REQUEST);
            }

            this.logger.log(`Ingesting file: ${filePath}`);
            await this.dataIngestionService.ingestMergedJsonFile(filePath);

            return {
                success: true,
                message: `Successfully ingested file: ${filePath}`,
            };
        } catch (error) {
            this.logger.error(`Failed to ingest file: ${error.message}`);
            throw new HttpException(
                `Failed to ingest file: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('ingest-all')
    async ingestAllFiles(@Body('directoryPath') directoryPath?: string) {
        try {
            this.logger.log('Starting bulk ingestion of all merged files');
            await this.dataIngestionService.ingestAllMergedFiles(directoryPath);

            return {
                success: true,
                message: 'Successfully ingested all files',
            };
        } catch (error) {
            this.logger.error(`Failed to ingest all files: ${error.message}`);
            throw new HttpException(
                `Failed to ingest all files: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('stats')
    async getIngestionStats() {
        try {
            const stats = await this.dataIngestionService.getIngestionStats();

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            this.logger.error(`Failed to get ingestion stats: ${error.message}`);
            throw new HttpException(
                `Failed to get ingestion stats: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
