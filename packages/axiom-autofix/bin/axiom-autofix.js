#!/usr/bin/env node
// axiom-autofix CLI.
//
// Subcommands:
//   mint-token                Print a one-shot approval token and its SHA;
//                             you record the SHA in .axiom-autofix.token.sha
//                             and pass --approve <token> on the apply call.
//   apply <path...>           Run fixes on the given files. Without
//                             --approve, prints what would change. With
//                             --approve <token>, writes the file IF the
//                             token's SHA matches the recorded one. The
//                             recorded SHA is consumed (set to "" after
//                             a successful apply) to prevent reuse.
//   diff <path...>            Alias for `apply` without --approve.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyFixesToFiles,
  summarise,
  mintApprovalToken,
  validateApprovalToken,
} from '../src/index.ts';

const TOKEN_FILE = '.axiom-autofix.token.sha';

function usage() {
  console.error(`axiom-autofix <subcommand>

  mint-token
  apply <path...> [--approve <token>] [--json]
  diff <path...> [--json]
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();
const subcommand = args.shift();

if (subcommand === 'mint-token') {
  const { token, sha } = mintApprovalToken();
  // Print SHA on its own line so an operator can pipe it into the token file
  // without grep gymnastics. Token goes to a separate line.
  console.log(`SHA: ${sha}`);
  console.log(`TOKEN: ${token}`);
  console.log('');
  console.log(`To enable a single apply: echo ${sha} > ${TOKEN_FILE}`);
  console.log(`Then run: axiom-autofix apply <path...> --approve ${token}`);
  process.exit(0);
}

if (subcommand === 'apply' || subcommand === 'diff') {
  let approve = '';
  let json = false;
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--approve') {
      approve = args[++i];
      if (approve === undefined) {
        console.error('apply: --approve requires a token argument');
        usage();
      }
    }
    else if (a === '--json') json = true;
    else paths.push(resolve(a));
  }
  if (paths.length === 0) usage();

  let approved = false;
  if (subcommand === 'apply' && approve) {
    if (!existsSync(TOKEN_FILE)) {
      console.error(`apply blocked: token file ${TOKEN_FILE} not present. Run 'axiom-autofix mint-token' first.`);
      process.exit(2);
    }
    const recordedSha = readFileSync(TOKEN_FILE, 'utf8').trim();
    if (!recordedSha) {
      console.error(`apply blocked: token file ${TOKEN_FILE} is empty (previous token already consumed).`);
      process.exit(2);
    }
    if (!validateApprovalToken(approve, recordedSha)) {
      console.error('apply blocked: --approve token does not match recorded SHA.');
      process.exit(2);
    }
    approved = true;
  }

  const results = applyFixesToFiles(paths, { approved });

  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(summarise(results));
    console.log('');
    const wrote = results.filter(r => r.applied).length;
    const gated = results.filter(r => r.blockedByGate).length;
    if (gated > 0) console.log(`${gated} change(s) computed but BLOCKED by approval gate. Pass --approve <token> to apply.`);
    if (wrote > 0) console.log(`${wrote} change(s) applied.`);
  }

  // Consume token on successful apply: clear the recorded SHA so a second
  // run requires a freshly minted one.
  if (approved && results.some(r => r.applied)) {
    writeFileSync(TOKEN_FILE, '', 'utf8');
  }

  process.exit(0);
}

usage();
