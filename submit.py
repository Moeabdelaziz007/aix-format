#!/usr/bin/env python3
import subprocess
import sys

def submit():
    try:
        # Check if there are changes to commit
        status_output = subprocess.check_output(['git', 'status', '--porcelain']).decode('utf-8').strip()

        if status_output:
            print("Committing remaining changes...")
            subprocess.check_call(['git', 'add', '.'])
            subprocess.check_call(['git', 'commit', '-m', 'Final submit update'])

        # Check current branch
        branch = subprocess.check_output(['git', 'branch', '--show-current']).decode('utf-8').strip()

        print(f"Current branch: {branch}")
        print("Submit complete!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error during submit: {e}")
        return False

if __name__ == '__main__':
    submit()
