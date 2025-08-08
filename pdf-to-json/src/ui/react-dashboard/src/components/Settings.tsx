import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Snackbar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  FormHelperText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  RestoreFromTrash as RestoreIcon,
  Preview as PreviewIcon,
  Backup as BackupIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { apiService } from '../services/api';

interface ConfigSection {
  web_downloader: {
    url: string;
    check_interval: number;
    download_path: string;
    max_retries: number;
    timeout: number;
    verify_ssl: boolean;
    headers: Record<string, string>;
    user_agent: string;
    enable_conditional_requests: boolean;
    enable_resume: boolean;
    rate_limit_delay: number;
  };
  file_watcher: {
    watch_path: string;
    file_patterns: string[];
    debounce_time: number;
    recursive: boolean;
    ignore_patterns: string[];
    enable_lock_detection: boolean;
    lock_check_interval: number;
  };
  processing: {
    max_concurrent_jobs: number;
    retry_attempts: number;
    timeout: number;
    queue_max_size: number;
    job_persistence_enabled: boolean;
    job_persistence_path: string;
    enable_progress_tracking: boolean;
    cleanup_completed_jobs_after: number;
    priority_levels: number;
  };
  caching: {
    enabled: boolean;
    redis_url: string;
    default_ttl: number;
    max_memory_cache_size: number;
    cache_strategies: Record<string, number>;
    enable_compression: boolean;
    connection_pool_size: number;
  };
  notifications: {
    enabled: boolean;
    types: string[];
    email_config: Record<string, any>;
    webhook_config: Record<string, any>;
    slack_config: Record<string, any>;
    notification_levels: string[];
    rate_limit: number;
  };
  monitoring: {
    enabled: boolean;
    health_check_interval: number;
    metrics_collection_interval: number;
    log_level: string;
    log_format: string;
    log_file: string | null;
    enable_structured_logging: boolean;
    metrics_retention_days: number;
    alert_thresholds: Record<string, number>;
  };
  security: {
    enable_api_authentication: boolean;
    jwt_secret_key: string;
    jwt_expiration_hours: number;
    api_rate_limit_per_minute: number;
    allowed_file_types: string[];
    max_file_size_mb: number;
    enable_ip_whitelisting: boolean;
    allowed_ips: string[];
    enable_cors: boolean;
    cors_origins: string[];
  };
  database: {
    url: string;
    pool_size: number;
    max_overflow: number;
    pool_timeout: number;
    pool_recycle: number;
    enable_migrations: boolean;
    backup_enabled: boolean;
    backup_interval_hours: number;
    retention_days: number;
  };
  environment: string;
  debug: boolean;
  config_hot_reload: boolean;
  data_directory: string;
  temp_directory: string;
}

interface ConfigBackup {
  id: string;
  name: string;
  timestamp: string;
  config: ConfigSection;
  description?: string;
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

const Settings: React.FC = () => {
  const [config, setConfig] = useState<ConfigSection | null>(null);
  const [originalConfig, setOriginalConfig] = useState<ConfigSection | null>(null);
  const [previewConfig, setPreviewConfig] = useState<ConfigSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [backups, setBackups] = useState<ConfigBackup[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<ConfigBackup | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showSensitiveFields, setShowSensitiveFields] = useState(false);
  const [hotReloadEnabled, setHotReloadEnabled] = useState(true);

  useEffect(() => {
    loadConfig();
    loadBackups();
  }, []);

  useEffect(() => {
    if (config && originalConfig) {
      const hasChangesNow = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(hasChangesNow);
      
      // Real-time validation
      if (hasChangesNow) {
        validateConfig(config);
      } else {
        setValidationErrors([]);
      }
    }
  }, [config, originalConfig]);

  // Hot reload effect
  useEffect(() => {
    if (hotReloadEnabled && hasChanges && config) {
      const debounceTimer = setTimeout(() => {
        applyHotReload();
      }, 2000); // 2 second debounce

      return () => clearTimeout(debounceTimer);
    }
  }, [config, hotReloadEnabled, hasChanges]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const configData = await apiService.getConfig();
      setConfig(configData);
      setOriginalConfig(JSON.parse(JSON.stringify(configData)));
      setHotReloadEnabled(configData.config_hot_reload || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      // In a real implementation, this would fetch from an API endpoint
      const mockBackups: ConfigBackup[] = [
        {
          id: '1',
          name: 'Production Backup',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          config: {} as ConfigSection,
          description: 'Backup before production deployment'
        },
        {
          id: '2',
          name: 'Development Snapshot',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          config: {} as ConfigSection,
          description: 'Development environment snapshot'
        }
      ];
      setBackups(mockBackups);
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  const validateConfig = useCallback((configToValidate: ConfigSection) => {
    const errors: ValidationError[] = [];

    // Web downloader validation
    if (!configToValidate.web_downloader.url) {
      errors.push({ field: 'web_downloader.url', message: 'URL is required', severity: 'error' });
    } else if (!configToValidate.web_downloader.url.startsWith('http')) {
      errors.push({ field: 'web_downloader.url', message: 'URL must start with http or https', severity: 'error' });
    }

    if (configToValidate.web_downloader.check_interval < 60) {
      errors.push({ field: 'web_downloader.check_interval', message: 'Check interval should be at least 60 seconds', severity: 'warning' });
    }

    if (configToValidate.web_downloader.max_retries < 0) {
      errors.push({ field: 'web_downloader.max_retries', message: 'Max retries cannot be negative', severity: 'error' });
    }

    // Processing validation
    if (configToValidate.processing.max_concurrent_jobs <= 0) {
      errors.push({ field: 'processing.max_concurrent_jobs', message: 'Max concurrent jobs must be positive', severity: 'error' });
    }

    if (configToValidate.processing.max_concurrent_jobs > 10) {
      errors.push({ field: 'processing.max_concurrent_jobs', message: 'High concurrent job count may impact performance', severity: 'warning' });
    }

    // Database validation
    if (!configToValidate.database.url) {
      errors.push({ field: 'database.url', message: 'Database URL is required', severity: 'error' });
    }

    if (configToValidate.database.pool_size <= 0) {
      errors.push({ field: 'database.pool_size', message: 'Pool size must be positive', severity: 'error' });
    }

    // Security validation
    if (configToValidate.security.enable_api_authentication && !configToValidate.security.jwt_secret_key) {
      errors.push({ field: 'security.jwt_secret_key', message: 'JWT secret key is required when authentication is enabled', severity: 'error' });
    }

    if (configToValidate.security.jwt_secret_key === 'default-dev-secret-change-in-production') {
      errors.push({ field: 'security.jwt_secret_key', message: 'Using default JWT secret key is not secure', severity: 'warning' });
    }

    setValidationErrors(errors);
    return errors;
  }, []);

  const applyHotReload = useCallback(async () => {
    if (!config || !hotReloadEnabled) return;

    try {
      // Validate before applying
      const errors = validateConfig(config);
      const hasErrors = errors.some(e => e.severity === 'error');
      
      if (hasErrors) {
        setError('Cannot apply hot reload: configuration has validation errors');
        return;
      }

      // Apply configuration without full restart
      await apiService.updateConfig(config);
      setSuccess('Configuration applied via hot reload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hot reload failed');
    }
  }, [config, hotReloadEnabled, validateConfig]);

  const createBackup = async () => {
    if (!config || !backupName.trim()) return;

    const backup: ConfigBackup = {
      id: Date.now().toString(),
      name: backupName.trim(),
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(config)),
      description: backupDescription.trim() || undefined
    };

    setBackups(prev => [backup, ...prev]);
    setBackupName('');
    setBackupDescription('');
    setShowBackupDialog(false);
    setSuccess(`Backup "${backup.name}" created successfully`);
  };

  const restoreFromBackup = (backup: ConfigBackup) => {
    setConfig(JSON.parse(JSON.stringify(backup.config)));
    setShowRestoreDialog(false);
    setSelectedBackup(null);
    setSuccess(`Configuration restored from backup "${backup.name}"`);
  };

  const deleteBackup = (backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
    setSuccess('Backup deleted successfully');
  };

  const exportConfig = () => {
    if (!config) return;

    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `config-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig(importedConfig);
        setSuccess('Configuration imported successfully');
      } catch (err) {
        setError('Failed to parse imported configuration file');
      }
    };
    reader.readAsText(file);
  };

  const previewChanges = () => {
    if (!config) return;
    setPreviewConfig(JSON.parse(JSON.stringify(config)));
    setShowPreview(true);
  };

  const getValidationIcon = (field: string) => {
    const fieldErrors = validationErrors.filter(e => e.field === field);
    if (fieldErrors.length === 0) return null;
    
    const hasError = fieldErrors.some(e => e.severity === 'error');
    const hasWarning = fieldErrors.some(e => e.severity === 'warning');
    
    if (hasError) {
      return <ErrorIcon color="error" fontSize="small" />;
    } else if (hasWarning) {
      return <WarningIcon color="warning" fontSize="small" />;
    }
    return null;
  };

  const getFieldHelperText = (field: string) => {
    const fieldErrors = validationErrors.filter(e => e.field === field);
    if (fieldErrors.length === 0) return '';
    return fieldErrors.map(e => e.message).join(', ');
  };

  const hasValidationErrors = validationErrors.some(e => e.severity === 'error');

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.updateConfig(config);
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      setSuccess('Configuration saved successfully');
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const reloadConfig = async () => {
    try {
      await apiService.reloadConfig();
      setSuccess('Configuration reloaded successfully');
      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload configuration');
    }
  };

  const resetToOriginal = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
    }
  };

  const updateConfigValue = (section: keyof ConfigSection, key: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading configuration...</Typography>
      </Box>
    );
  }

  if (!config) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading configuration...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <Alert 
          severity={hasValidationErrors ? "error" : "warning"} 
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Configuration Validation Issues:
          </Typography>
          <List dense>
            {validationErrors.map((error, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemText 
                  primary={`${error.field}: ${error.message}`}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    color: error.severity === 'error' ? 'error' : 'warning.main'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Hot Reload Status */}
      {hotReloadEnabled && hasChanges && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Hot reload is enabled. Changes will be applied automatically in 2 seconds.
          </Typography>
        </Alert>
      )}

      {/* Action Buttons */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveConfig}
              disabled={saving || !hasChanges || hasValidationErrors}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={previewChanges}
              disabled={!hasChanges}
            >
              Preview Changes
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={reloadConfig}
              disabled={saving}
            >
              Reload Config
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={resetToOriginal}
              disabled={!hasChanges}
            >
              Reset Changes
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<BackupIcon />}
              onClick={() => setShowBackupDialog(true)}
            >
              Create Backup
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setShowRestoreDialog(true)}
            >
              Restore
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportConfig}
            >
              Export
            </Button>
          </Grid>
          <Grid item>
            <input
              accept=".json"
              style={{ display: 'none' }}
              id="import-config-file"
              type="file"
              onChange={importConfig}
            />
            <label htmlFor="import-config-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
              >
                Import
              </Button>
            </label>
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={hotReloadEnabled}
                  onChange={(e) => setHotReloadEnabled(e.target.checked)}
                  size="small"
                />
              }
              label="Hot Reload"
            />
          </Grid>
          <Grid item>
            <Tooltip title={showSensitiveFields ? "Hide sensitive fields" : "Show sensitive fields"}>
              <IconButton
                onClick={() => setShowSensitiveFields(!showSensitiveFields)}
                size="small"
              >
                {showSensitiveFields ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs>
            {hasChanges && (
              <Chip 
                label="Unsaved Changes" 
                color="warning" 
                variant="outlined"
                icon={<WarningIcon />}
              />
            )}
            {validationErrors.length > 0 && (
              <Chip 
                label={`${validationErrors.length} Validation Issues`}
                color={hasValidationErrors ? "error" : "warning"}
                variant="outlined"
                icon={hasValidationErrors ? <ErrorIcon /> : <WarningIcon />}
                sx={{ ml: 1 }}
              />
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Configuration Sections */}
      <Grid container spacing={3}>
        {/* Web Downloader Configuration */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Web Downloader</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Source URL"
                    value={config.web_downloader.url}
                    onChange={(e) => updateConfigValue('web_downloader', 'url', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Download Path"
                    value={config.web_downloader.download_path}
                    onChange={(e) => updateConfigValue('web_downloader', 'download_path', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Check Interval (seconds)"
                    value={config.web_downloader.check_interval}
                    onChange={(e) => updateConfigValue('web_downloader', 'check_interval', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Retries"
                    value={config.web_downloader.max_retries}
                    onChange={(e) => updateConfigValue('web_downloader', 'max_retries', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Timeout (seconds)"
                    value={config.web_downloader.timeout}
                    onChange={(e) => updateConfigValue('web_downloader', 'timeout', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.web_downloader.verify_ssl}
                        onChange={(e) => updateConfigValue('web_downloader', 'verify_ssl', e.target.checked)}
                      />
                    }
                    label="Verify SSL Certificates"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* File Watcher Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">File Watcher</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Watch Path"
                    value={config.file_watcher.watch_path}
                    onChange={(e) => updateConfigValue('file_watcher', 'watch_path', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Debounce Time (seconds)"
                    value={config.file_watcher.debounce_time}
                    onChange={(e) => updateConfigValue('file_watcher', 'debounce_time', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="File Patterns (comma-separated)"
                    value={config.file_watcher.file_patterns.join(', ')}
                    onChange={(e) => updateConfigValue('file_watcher', 'file_patterns', e.target.value.split(',').map(s => s.trim()))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Processing Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Processing</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Concurrent Jobs"
                    value={config.processing.max_concurrent_jobs}
                    onChange={(e) => updateConfigValue('processing', 'max_concurrent_jobs', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retry Attempts"
                    value={config.processing.retry_attempts}
                    onChange={(e) => updateConfigValue('processing', 'retry_attempts', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Timeout (seconds)"
                    value={config.processing.timeout}
                    onChange={(e) => updateConfigValue('processing', 'timeout', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Caching Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Caching</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.caching.enabled}
                        onChange={(e) => updateConfigValue('caching', 'enabled', e.target.checked)}
                      />
                    }
                    label="Enable Caching"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Redis URL"
                    value={config.caching.redis_url}
                    onChange={(e) => updateConfigValue('caching', 'redis_url', e.target.value)}
                    type={showSensitiveFields ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: getValidationIcon('caching.redis_url')
                    }}
                    helperText={getFieldHelperText('caching.redis_url')}
                    error={validationErrors.some(e => e.field === 'caching.redis_url' && e.severity === 'error')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Default TTL (seconds)"
                    value={config.caching.default_ttl}
                    onChange={(e) => updateConfigValue('caching', 'default_ttl', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Security Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Security</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.security.enable_api_authentication}
                        onChange={(e) => updateConfigValue('security', 'enable_api_authentication', e.target.checked)}
                      />
                    }
                    label="Enable API Authentication"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="JWT Secret Key"
                    value={config.security.jwt_secret_key}
                    onChange={(e) => updateConfigValue('security', 'jwt_secret_key', e.target.value)}
                    type={showSensitiveFields ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: getValidationIcon('security.jwt_secret_key')
                    }}
                    helperText={getFieldHelperText('security.jwt_secret_key')}
                    error={validationErrors.some(e => e.field === 'security.jwt_secret_key' && e.severity === 'error')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="API Rate Limit (per minute)"
                    value={config.security.api_rate_limit_per_minute}
                    onChange={(e) => updateConfigValue('security', 'api_rate_limit_per_minute', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Database Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Database</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Database URL"
                    value={config.database.url}
                    onChange={(e) => updateConfigValue('database', 'url', e.target.value)}
                    type={showSensitiveFields ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: getValidationIcon('database.url')
                    }}
                    helperText={getFieldHelperText('database.url')}
                    error={validationErrors.some(e => e.field === 'database.url' && e.severity === 'error')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Pool Size"
                    value={config.database.pool_size}
                    onChange={(e) => updateConfigValue('database', 'pool_size', parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: getValidationIcon('database.pool_size')
                    }}
                    helperText={getFieldHelperText('database.pool_size')}
                    error={validationErrors.some(e => e.field === 'database.pool_size' && e.severity === 'error')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Overflow"
                    value={config.database.max_overflow}
                    onChange={(e) => updateConfigValue('database', 'max_overflow', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Monitoring Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Monitoring</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.monitoring.enabled}
                        onChange={(e) => updateConfigValue('monitoring', 'enabled', e.target.checked)}
                      />
                    }
                    label="Enable Monitoring"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Log Level</InputLabel>
                    <Select
                      value={config.monitoring.log_level}
                      label="Log Level"
                      onChange={(e) => updateConfigValue('monitoring', 'log_level', e.target.value)}
                    >
                      <MenuItem value="DEBUG">DEBUG</MenuItem>
                      <MenuItem value="INFO">INFO</MenuItem>
                      <MenuItem value="WARNING">WARNING</MenuItem>
                      <MenuItem value="ERROR">ERROR</MenuItem>
                      <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Health Check Interval (seconds)"
                    value={config.monitoring.health_check_interval}
                    onChange={(e) => updateConfigValue('monitoring', 'health_check_interval', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Backup Creation Dialog */}
      <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Configuration Backup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Backup Name"
            fullWidth
            variant="outlined"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={backupDescription}
            onChange={(e) => setBackupDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
          <Button onClick={createBackup} variant="contained" disabled={!backupName.trim()}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Restore Configuration</DialogTitle>
        <DialogContent>
          <List>
            {backups.map((backup) => (
              <ListItem key={backup.id} divider>
                <ListItemText
                  primary={backup.name}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(backup.timestamp).toLocaleString()}
                      </Typography>
                      {backup.description && (
                        <Typography variant="body2" color="text.secondary">
                          {backup.description}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedBackup(backup);
                      restoreFromBackup(backup);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Restore
                  </Button>
                  <IconButton
                    edge="end"
                    onClick={() => deleteBackup(backup.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          {backups.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No backups available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestoreDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Configuration Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {previewConfig ? JSON.stringify(previewConfig, null, 2) : ''}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          <Button onClick={saveConfig} variant="contained" disabled={hasValidationErrors}>
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;