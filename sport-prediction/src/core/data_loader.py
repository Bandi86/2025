import pandas as pd

def load_data(file_paths) -> pd.DataFrame:
    """
    Loads data from CSV file(s), converts the 'Date' column to datetime objects,
    and sorts the dataframe by date.

    Args:
        file_paths: String path to a single file, or list of paths to multiple files
    """
    if isinstance(file_paths, str):
        file_paths = [file_paths]

    dataframes = []
    for file_path in file_paths:
        print(f"✅ {file_path}: ", end="")
        try:
            df = pd.read_csv(file_path)
            print(f"{len(df)} mérkőzés")
            dataframes.append(df)
        except FileNotFoundError:
            print(f"⚠️ Hiányzó fájl: {file_path}")
        except Exception as e:
            print(f"❌ Hiba: {e}")

    if not dataframes:
        raise ValueError("Nincs múltbeli adat!")

    # Kombinálás
    df = pd.concat(dataframes, ignore_index=True)

    # Dátum feldolgozás - próbáljuk többféle formátumot
    try:
        df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y')
    except:
        try:
            df['Date'] = pd.to_datetime(df['Date'], format='%Y-%m-%d')
        except:
            df['Date'] = pd.to_datetime(df['Date'], infer_datetime_format=True)

    df = df.sort_values('Date').reset_index(drop=True)
    print(f"✅ Összesen {len(df)} múltbeli mérkőzés betöltve")
    return df
