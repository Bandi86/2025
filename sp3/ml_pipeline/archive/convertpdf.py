# tabula vagy camelot használata PDF konvertálásához
# a forras .. pdf mappaban található cel hogy az abban levo talbazatszeru meccs adatokat szovegge alakítsuk.
# tablazat teteje: Kezdési idő Sorszám M.k. Fogadási esemény Kim. H D V ezutan jon a datum melyik napon vannak a meccsek a kovetkezo sorban pedig azt latjuk pl hogy labdarugas del korai bajnoksag es ez utan jon tablazat es a kinalat. a szurke reszben minidig a sportag bajnoksag mengevezese van. Probaljuk levalogatni csak a labdarugas meccseket es a kinalatot.

import os
import camelot
import tabula

PDF_DIR = "../pdf"  # vagy a pontos útvonal, ahol a PDF-ek vannak
OUTPUT_DIR = "./pdf_output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_tables_camelot(pdf_path, output_csv):
    print(f"Camelot: {pdf_path}")
    tables = camelot.read_pdf(pdf_path, pages="all", flavor="stream")
    print(f"Talált táblázatok: {tables.n}")
    if tables.n > 0:
        tables.export(output_csv, f="csv", compress=False)
        print(f"Mentve: {output_csv}")
    else:
        print("Nem talált táblázatot a Camelot.")

def extract_tables_tabula(pdf_path, output_csv):
    print(f"Tabula: {pdf_path}")
    try:
        tabula.convert_into(pdf_path, output_csv, output_format="csv", pages="all")
        print(f"Mentve: {output_csv}")
    except Exception as e:
        print(f"Tabula hiba: {e}")

if __name__ == "__main__":
    for fname in os.listdir(PDF_DIR):
        if fname.lower().endswith(".pdf"):
            pdf_path = os.path.join(PDF_DIR, fname)
            base = os.path.splitext(fname)[0]
            out_camelot = os.path.join(OUTPUT_DIR, f"{base}_camelot.csv")
            out_tabula = os.path.join(OUTPUT_DIR, f"{base}_tabula.csv")
            extract_tables_camelot(pdf_path, out_camelot)
            extract_tables_tabula(pdf_path, out_tabula)

