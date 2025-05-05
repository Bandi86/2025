// Új title generátor: csak a két dátum közötti rész kell a path-ból, \ nélkül
function generateTitleFromPath(path: string): string {
  // Példa: .../Filmek/2022/Matrix.1999.1080p.mkv -> csak a 2022 és 1999 közötti rész kell
  // Feltételezzük, hogy a path tartalmaz két évszámot (pl. .../2022/Matrix.1999.1080p.mkv)
  // Kivágjuk a két évszám közötti részt
  const match = path.match(/\\(\d{4})\\([^\\]+?)(\d{4})/); // pl. ...\2022\Matrix.1999
  if (match) {
    // match[2] tartalmazza a két év közötti részt, de lehet benne pont vagy egyéb karakter
    return match[2].replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Ha nincs két évszám, fallback: utolsó mappa vagy fájlnév kiterjesztés nélkül
  const parts = path.split('\\');
  const last = parts[parts.length - 1].replace(/\.[^.]+$/, '');
  return last.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export default generateTitleFromPath;
