declare module 'cli-loading-animation' {
  interface LoadingControls {
    start: () => void;
    stop: () => void;
  }

  export function loading(message: string): LoadingControls;
}