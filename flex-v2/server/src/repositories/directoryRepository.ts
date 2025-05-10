// Mock in-memory tároló a könyvtárakhoz
let directories: Array<{
  id: string;
  path: string;
  name: string;
  created_at: string;
  files_count: number;
}> = [];
let idCounter = 1;

export async function getAll() {
  return directories;
}

export async function add(dirPath: string) {
  const dir = {
    id: String(idCounter++),
    path: dirPath,
    name: dirPath.split('/').pop() || dirPath,
    created_at: new Date().toISOString(),
    files_count: 0,
  };
  directories.push(dir);
  return dir;
}

export async function remove(id: string) {
  directories = directories.filter((d) => d.id !== id);
}

export async function updateFilesCountByPath(path: string, count: number) {
  const dir = directories.find((d) => d.path === path);
  if (dir) {
    dir.files_count = count;
  }
}
