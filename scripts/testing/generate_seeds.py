import os
import re
import random
import datetime
from pathlib import Path

SOURCE_DIR = "__tests__/e2e/fixtures/db/migrations"       # Папка с .sql файлами схем
OUTPUT_DIR = "__tests__/e2e/fixtures/db/migrations/seeds" # Папка, куда будут сохраняться seed-файлы
ROWS_PER_TABLE = 3 # Кол-во сидов на таблицу

os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_value(column_type, column_name):
    column_type = column_type.lower()

    if "int" in column_type:
        return str(random.randint(1, 1000))
    elif "decimal" in column_type or "float" in column_type:
        return str(round(random.uniform(1, 1000), 4))
    elif "char" in column_type or "varchar" in column_type:
        return f"'{column_name}_{random.randint(1, 100)}'"
    elif "text" in column_type:
        return f"'Some text for {column_name}'"
    elif "json" in column_type:
        return "'{}'"
    elif "enum" in column_type:
        enum_values = re.findall(r"'(.*?)'", column_type)
        return f"'{random.choice(enum_values)}'" if enum_values else "'default'"
    elif "date" in column_type:
        return f"'{datetime.date.today().isoformat()}'"
    elif "timestamp" in column_type:
        return f"'{datetime.datetime.now().isoformat(sep=' ')}'"
    else:
        return "NULL"

def parse_columns(sql_content):
    inside_table = False
    columns = []
    lines = sql_content.splitlines()
    for line in lines:
        line = line.strip().rstrip(',')
        if line.lower().startswith("create table"):
            inside_table = True
            table_name = re.findall(r"create table\s+`?(\w+)`?", line, re.I)[0]
        elif inside_table and line.startswith(")"):
            break
        elif inside_table and line and not line.lower().startswith("constraint") and not line.lower().startswith("index"):
            match = re.match(r"(\w+)\s+([^\s,]+(?:\s*\([^)]*\))?)", line)
            if match:
                col_name, col_type = match.groups()
                if col_name.lower() not in {"primary", "key"}:
                    columns.append((col_name, col_type))
    return table_name, columns

def generate_insert(table, columns):
    col_names = ", ".join(f"`{col[0]}`" for col in columns)
    values_list = []
    for _ in range(ROWS_PER_TABLE):
        values = ", ".join(generate_value(col[1], col[0]) for col in columns)
        values_list.append(f"INSERT INTO `{table}` ({col_names}) VALUES ({values});")
    return "\n".join(values_list)

# Обработка всех файлов
for file in os.listdir(SOURCE_DIR):
    if file.endswith(".sql"):
        with open(os.path.join(SOURCE_DIR, file), 'r') as f:
            content = f.read()

        try:
            table_name, columns = parse_columns(content)
            seed_sql = generate_insert(table_name, columns)
            seed_file = os.path.join(OUTPUT_DIR, f"{table_name}_seed.sql")
            with open(seed_file, "w") as out:
                out.write(seed_sql + "\n")
            print(f"✅ Created seed for table: {table_name}")
        except Exception as e:
            print(f"❌ Failed to process {file}: {e}")
