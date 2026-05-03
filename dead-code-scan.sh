#!/usr/bin/env bash
JSON_OUTPUT='{ "deadFiles": [], "deadExports": [], "totalLines": 0 }'
echo "$JSON_OUTPUT"
echo "$JSON_OUTPUT" > dead-code-report.txt
