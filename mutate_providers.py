import pandas as pd
import random

INPUT_FILE = "providers_200.csv"
OUTPUT_FILE = "providers_200_mutated.csv"

def mutate_phone(phone):
    """Return a wrong/random phone number."""
    return "".join([str(random.randint(0, 9)) for _ in range(10)])


def mutate_address(address):
    """Modify the address slightly to simulate real-world incorrect entries."""
    suffixes = [" Suite 200", " Apt 5B", " Building 3", " Floor 4", " Unit 9"]
    return address + random.choice(suffixes)


def introduce_errors(df, col, mutation_func, error_rate=0.10):
    """
    Modify 'error_rate'% of rows for the given column.
    """
    total_rows = len(df)
    num_errors = int(total_rows * error_rate)

    print(f"Introducing {num_errors} errors into '{col}'")

    error_indices = random.sample(range(total_rows), num_errors)

    for idx in error_indices:
        original = df.loc[idx, col]
        df.loc[idx, col] = mutation_func(original)

    return df


def mutate_csv():
    print(f"Loading original providers file: {INPUT_FILE}")
    df = pd.read_csv(INPUT_FILE)

    # Introduce 10% wrong phone numbers
    df = introduce_errors(df, "phone", mutate_phone, error_rate=0.10)

    # Introduce 10% wrong addresses
    df = introduce_errors(df, "address_1", mutate_address, error_rate=0.10)

    # Save mutated file
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nMutated CSV saved → {OUTPUT_FILE}")
    print("Done!")


if __name__ == "__main__":
    mutate_csv()
