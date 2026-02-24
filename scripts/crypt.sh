#!/usr/bin/env bash

# # Encrypt a file
# ./crypt.sh encrypt passwords.txt
# # produces passwords.txt.enc
#
# # Decrypt a file
# ./crypt.sh decrypt passwords.txt.enc

# produces passwords.txt
# Function to check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# Check if openssl is installed
if ! command_exists openssl; then
  echo "Error: openssl is not installed."
  exit 1
fi

# Usage info
usage() {
  echo "Usage: $0 [encrypt|decrypt] <file>"
  echo "  encrypt <file>  - Encrypt file with a password"
  echo "  decrypt <file>  - Decrypt file with a password"
  exit 1
}

# Check if arguments are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  usage
fi

FILE="$2"

case "$1" in
encrypt)
  # Check if file exists
  if [ ! -f "$FILE" ]; then
    echo "Error: File '$FILE' not found."
    exit 1
  fi

  # Read password (hidden input)
  echo -n "Enter encryption password: "
  read -rs PASSWORD
  echo

  # Confirm password
  echo -n "Confirm encryption password: "
  read -rs PASSWORD_CONFIRM
  echo

  # Check if passwords match
  if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    echo "Error: Passwords do not match."
    exit 1
  fi

  # Encrypt directly to file.enc
  if openssl enc -aes-256-cbc -pbkdf2 -in "$FILE" -out "${FILE}.enc" -pass pass:"$PASSWORD"; then
    echo "File encrypted successfully: ${FILE}.enc"
  else
    echo "Error: Encryption failed."
    exit 1
  fi
  ;;

decrypt)
  # Check if file exists
  if [ ! -f "$FILE" ]; then
    echo "Error: File '$FILE' not found."
    exit 1
  fi

  # Read password (hidden input)
  echo -n "Enter decryption password: "
  read -rs PASSWORD
  echo

  # Decrypt directly to original filename (strip .enc if present)
  OUTPUT="${FILE%.enc}"
  if openssl enc -d -aes-256-cbc -pbkdf2 -in "$FILE" -out "$OUTPUT" -pass pass:"$PASSWORD" 2>/dev/null; then
    echo "File decrypted successfully: $OUTPUT"
  else
    echo "Error: Decryption failed. Wrong password or invalid file."
    rm -f "$OUTPUT"
    exit 1
  fi
  ;;

*)
  usage
  ;;
esac
