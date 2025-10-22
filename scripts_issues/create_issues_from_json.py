#!/usr/bin/env python3
"""
Create GitHub issues from a JSON file.

JSON format:

{
    "issues": [
        {
            "issue_title": "Title here",
            "issue_description": "Description here"
        }
    ]
}

Usage:
  - Set GITHUB_TOKEN env var or pass --token
  - python create_issues_from_json.py --repo owner/repo --file issues.json

"""
from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional

import requests

API_BASE = "https://api.github.com"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Create GitHub issues from a JSON file")
    p.add_argument("--repo", required=True, help="Repository in the form owner/repo")
    p.add_argument("--file", required=True, help="Path to the JSON file containing issues")
    p.add_argument("--token", help="GitHub personal access token (or set GITHUB_TOKEN env var)")
    p.add_argument("--assignee", help="Assign all created issues to this GitHub username")
    p.add_argument("--labels", help="Comma-separated labels to add to each issue")
    p.add_argument("--project-column-id", help="(classic projects) Add created issues to this project column id")
    p.add_argument("--project-v2-id", help="(projects v2) Add created issues to this project v2 id (GraphQL ID)")
    p.add_argument("--dry-run", action="store_true", help="Show what would be created without calling GitHub")
    p.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    return p.parse_args()


def load_issues(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    if not isinstance(data, dict) or "issues" not in data:
        raise ValueError("JSON must contain a top-level 'issues' list")

    issues = data["issues"]
    if not isinstance(issues, list):
        raise ValueError("'issues' must be an array")

    # normalize each issue
    out = []
    for i, it in enumerate(issues, start=1):
        if not isinstance(it, dict):
            raise ValueError(f"issue at index {i} is not an object")

        title = it.get("issue_title")
        body = it.get("issue_description")
        if not title:
            raise ValueError(f"issue at index {i} missing 'issue_title'")

        out.append({"title": title, "body": body or ""})

    return out


def create_issue(repo: str, token: str, title: str, body: str, assignee: Optional[str] = None, labels: Optional[List[str]] = None) -> Dict[str, Any]:
    url = f"{API_BASE}/repos/{repo}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "create-issues-script",
    }
    payload: Dict[str, Any] = {"title": title, "body": body}
    if assignee:
        payload["assignee"] = assignee
    if labels:
        payload["labels"] = labels

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    return {"status_code": resp.status_code, "json": resp.json() if resp.content else None, "text": resp.text}


def add_issue_to_classic_project(column_id: str, issue_db_id: int, token: str) -> Dict[str, Any]:
        """Add an issue to a classic project column by column id.

        column_id: numeric id of the column (not project id)
        issue_db_id: the repository issue DB id (returned as 'id' in create issue REST response)
        """
        url = f"{API_BASE}/projects/columns/{column_id}/cards"
        headers = {
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "create-issues-script",
        }
        payload = {"content_id": issue_db_id, "content_type": "Issue"}
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        return {"status_code": resp.status_code, "json": resp.json() if resp.content else None, "text": resp.text}


def add_issue_to_project_v2(project_v2_id: str, issue_node_id: str, token: str) -> Dict[str, Any]:
        """Add an issue to a Projects V2 project using the GraphQL API.

        project_v2_id: the GraphQL project id (starts with 'PRJ' typically)
        issue_node_id: the issue node_id returned in the REST issue creation (global node id)
        """
        url = f"{API_BASE}/graphql"
        headers = {
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "create-issues-script",
        }
        query = """
        mutation AddProjectV2Item($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                item {
                    id
                }
            }
        }
        """
        variables = {"projectId": project_v2_id, "contentId": issue_node_id}
        resp = requests.post(url, headers=headers, json={"query": query, "variables": variables}, timeout=30)
        return {"status_code": resp.status_code, "json": resp.json() if resp.content else None, "text": resp.text}


def main() -> int:
    args = parse_args()

    token = args.token or os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: a GitHub token must be provided via --token or GITHUB_TOKEN env var", file=sys.stderr)
        return 2

    try:
        issues = load_issues(args.file)
    except Exception as e:
        print(f"Failed to load issues file: {e}", file=sys.stderr)
        return 3

    labels = [l.strip() for l in args.labels.split(",")] if args.labels else None

    failures = 0
    for idx, issue in enumerate(issues, start=1):
        title = issue["title"]
        body = issue.get("body", "")

        if args.dry_run:
            print(f"DRY RUN: Would create issue #{idx}: title={title!r}")
            continue

        if args.verbose:
            print(f"Creating issue #{idx}: {title}")

        try:
            result = create_issue(args.repo, token, title, body, assignee=args.assignee, labels=labels)
        except requests.RequestException as e:
            print(f"Request failed for issue #{idx} ({title}): {e}", file=sys.stderr)
            failures += 1
            continue

        code = result.get("status_code")
        if code == 201:
            j = result.get("json") or {}
            issue_html = j.get('html_url', 'unknown url')
            print(f"Created: {issue_html} (#{idx})")

            # Optionally add to projects
            if args.project_column_id:
                # classic project columns require the issue DB id
                issue_db_id = j.get("id")
                if issue_db_id:
                    if args.verbose:
                        print(f"Adding issue #{idx} (db id={issue_db_id}) to project column {args.project_column_id}")
                    try:
                        pr = add_issue_to_classic_project(args.project_column_id, issue_db_id, token)
                    except requests.RequestException as e:
                        print(f"Failed to add issue #{idx} to project column: {e}", file=sys.stderr)
                        failures += 1
                        continue

                    if pr.get("status_code") in (200, 201):
                        print(f"Added to classic project column {args.project_column_id}")
                    else:
                        failures += 1
                        pjmsg = pr.get("json") or pr.get("text")
                        print(f"Failed to add to project column: status={pr.get('status_code')} message={pjmsg}", file=sys.stderr)
                else:
                    failures += 1
                    print(f"Cannot add to project column: missing issue DB id for issue #{idx}", file=sys.stderr)

            if args.project_v2_id:
                # Projects V2 requires the issue node_id
                issue_node_id = j.get("node_id")
                if issue_node_id:
                    if args.verbose:
                        print(f"Adding issue #{idx} (node id={issue_node_id}) to project v2 {args.project_v2_id}")
                    try:
                        pr2 = add_issue_to_project_v2(args.project_v2_id, issue_node_id, token)
                    except requests.RequestException as e:
                        print(f"Failed to add issue #{idx} to project v2: {e}", file=sys.stderr)
                        failures += 1
                        continue

                    if pr2.get("status_code") == 200:
                        # Check for errors in GraphQL response
                        body_json = pr2.get("json") or {}
                        if body_json.get("errors"):
                            failures += 1
                            print(f"GraphQL errors adding to project v2: {body_json['errors']}", file=sys.stderr)
                        else:
                            print(f"Added to project v2 {args.project_v2_id}")
                    else:
                        failures += 1
                        pjmsg = pr2.get("json") or pr2.get("text")
                        print(f"Failed to add to project v2: status={pr2.get('status_code')} message={pjmsg}", file=sys.stderr)
                else:
                    failures += 1
                    print(f"Cannot add to project v2: missing issue node_id for issue #{idx}", file=sys.stderr)
        else:
            failures += 1
            j = result.get("json")
            msg = j.get("message") if isinstance(j, dict) else result.get("text")
            print(f"Failed to create issue #{idx}: status={code} message={msg}", file=sys.stderr)

    if failures:
        print(f"Completed with {failures} failures", file=sys.stderr)
        return 1

    print("All issues processed successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
