import os
import requests
import json
import shutil

PDF_DIR = 'pdf'
ARCHIVE_DIR = os.path.join(PDF_DIR, 'archive')
BACKEND_URL = 'http://localhost:3001/odds-collector/process-pdf'

def process_pdf_files():
    print(f"Scanning directory: {PDF_DIR} for .txt files...")
    processed_count = 0

    for filename in os.listdir(PDF_DIR):
        if filename.endswith('.txt'):
            filepath = os.path.join(PDF_DIR, filename)
            print(f"Processing file: {filename}")

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    ocr_content = f.read()

                headers = {'Content-Type': 'text/plain'}
                response = requests.post(BACKEND_URL, data=ocr_content.encode('utf-8'), headers=headers)

                if response.status_code == 201 or response.status_code == 200:
                    print(f"Successfully sent {filename} to backend. Response: {response.text}")
                    # Move to archive
                    shutil.move(filepath, os.path.join(ARCHIVE_DIR, filename))
                    print(f"Moved {filename} to {ARCHIVE_DIR}")
                    processed_count += 1
                else:
                    print(f"Failed to send {filename} to backend. Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                print(f"An error occurred while processing {filename}: {e}")

    if processed_count == 0:
        print("No new .txt files found to process.")
    else:
        print(f"Finished processing {processed_count} file(s).")

if __name__ == '__main__':
    # Ensure the archive directory exists
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    process_pdf_files()
