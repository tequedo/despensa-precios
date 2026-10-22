"""Read-only diagnostic for the designated SEPA server; never provisions it."""

import argparse
import datetime
import ipaddress
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile


IP_ENDPOINTS = ("https://api.ipify.org", "https://checkip.amazonaws.com")
OFFICIAL_METADATA = "https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios"
DATASET_ID = "6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5"
MAX_BYTES = 2 * 1024 * 1024


def public_ipv4(value):
    address = ipaddress.ip_address(value.strip())
    if address.version != 4 or not address.is_global:
        raise ValueError("Se requiere una IPv4 pública del servidor designado")
    return str(address)


def request(url):
    # Use the server's direct IPv4 path. No proxy, redirects, retries, cookies,
    # TLS bypass or IP rotation; a SEPA denial remains a denial.
    with tempfile.TemporaryDirectory(prefix="sepa-egress-") as temporary:
        body = Path(temporary) / "body"
        headers = Path(temporary) / "headers"
        try:
            result = subprocess.run([
                "curl", "--disable", "--ipv4", "--noproxy", "*", "--proto", "=https",
                "--silent", "--show-error", "--connect-timeout", "10",
                "--max-time", "25", "--max-filesize", str(MAX_BYTES),
                "--output", str(body), "--dump-header", str(headers),
                "--write-out", "%{http_code}", url,
            ], capture_output=True, text=True, timeout=30, check=False)
        except (OSError, subprocess.TimeoutExpired):
            return {"status": None, "error": "transport_unavailable"}
        if result.returncode:
            return {"status": None, "error": "curl_failed", "curlExitCode": result.returncode}
        status = int(result.stdout) if re.fullmatch(r"[1-5][0-9]{2}", result.stdout) else None
        try:
            return {
                "status": status,
                "body": body.read_bytes()[:MAX_BYTES].decode("utf-8", errors="replace"),
                "headers": headers.read_bytes()[:65536].decode("utf-8", errors="replace"),
            }
        except OSError:
            return {"status": status, "error": "response_unavailable"}


def metadata_evidence(response):
    body = response.get("body", "")
    header_id = re.findall(r"^x-request-id:\s*([a-z0-9_.:-]{1,128})\s*$",
                           response.get("headers", ""), flags=re.I | re.M)
    html_id = re.search(r"Request ID:\s*(?:<[^>]+>\s*)*([a-f0-9]{32})\b", body, flags=re.I)
    evidence = {
        "url": OFFICIAL_METADATA, "status": response.get("status"),
        "transportError": response.get("error"),
        "requestId": header_id[-1] if header_id else html_id.group(1) if html_id else None,
        "protection": "BunkerWeb" if "bunkerweb" in body.lower() else None,
        "metadataValid": False,
    }
    if response.get("status") == 200:
        try:
            document = json.loads(body)
            result = document.get("result")
            evidence["metadataValid"] = (
                document.get("success") is True and isinstance(result, dict)
                and result.get("id") == DATASET_ID
                and result.get("name") == "sepa-precios"
                and isinstance(result.get("resources"), list)
            )
        except (ValueError, AttributeError):
            pass
    # Keep no HTML, arbitrary headers, cookies, credentials or resource data.
    return evidence


def diagnose(expected_ip, fetch=request):
    expected_ip = public_ipv4(expected_ip)
    report = {
        "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "expectedIpv4": expected_ip, "ipMeasurements": [],
        "networkPath": "direct_ipv4_no_proxy", "expectedEgressObserved": False,
        "fixedIpVerified": False, "operatorAuthorizationConfirmed": False,
        "officialMetadata": None, "officialArchiveDownloaded": False,
        "productionUpdated": False,
    }
    for endpoint in IP_ENDPOINTS:
        response = fetch(endpoint)
        observation = {"endpoint": endpoint, "status": response.get("status"), "ipv4": None}
        try:
            if response.get("status") != 200:
                raise ValueError("ip_endpoint_unavailable")
            observation["ipv4"] = public_ipv4(response.get("body", ""))
        except ValueError:
            observation["error"] = "public_ipv4_not_observed"
        report["ipMeasurements"].append(observation)
    report["expectedEgressObserved"] = all(
        item["ipv4"] == expected_ip for item in report["ipMeasurements"])
    if report["expectedEgressObserved"]:
        report["officialMetadata"] = metadata_evidence(fetch(OFFICIAL_METADATA))
    else:
        report["stopReason"] = "expected_egress_not_confirmed"
    return report


def write_report(path, report):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Refuse replacement and symlinks. The report contains the server's IP and
    # stays local; do not commit it or print it to a public Actions log.
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
        output.write("\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--expected-ip", required=True, type=public_ipv4,
                        help="IPv4 que el proveedor asignó al servidor designado")
    parser.add_argument("--output", default="artifacts/sepa-egress-probe.json")
    arguments = parser.parse_args()
    report = diagnose(arguments.expected_ip)
    try:
        write_report(arguments.output, report)
    except OSError:
        parser.exit(2, "No se pudo crear el informe privado; usar una ruta nueva y escribible.\n")
    valid = report["expectedEgressObserved"] and bool(
        report["officialMetadata"] and report["officialMetadata"]["metadataValid"])
    print(json.dumps({"report": arguments.output, "expectedEgressObserved": report["expectedEgressObserved"],
                      "metadataValid": bool(valid), "officialArchiveDownloaded": False,
                      "productionUpdated": False}, ensure_ascii=False))
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
