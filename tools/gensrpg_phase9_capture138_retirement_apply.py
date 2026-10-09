#!/usr/bin/env python3
"""Exact Rule-26-only Capture138 runtime seam; no heuristic or unrelated replacements."""
from pathlib import Path
import base64, hashlib

ROOT=Path(__file__).resolve().parents[1]
f=ROOT/'index.html'
before=f.read_bytes()
blob=lambda data: hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()
assert len(before)==8165398 and blob(before)=='18627cc0c5fc7945732c8a910504c59ef823b6ae','wrong base Rule 26'
old=base64.b64decode('LyogLS0tLS0tLS0tLSBkw6ltYXJyYWdlIENhcHR1cmUgOiBhcnJpdmUgZGlyZWN0ZW1lbnQgc3VyIEV4cGxvcmVyIC8gSHViIC0tLS0tLS0tLS0gKi8KY29uc3Qgc3RhcnQxMzg9d2luZG93LnN0YXJ0Q29uZmlndXJlZEdhbWU7CndpbmRvdy5zdGFydENvbmZpZ3VyZWRHYW1lPWFzeW5jIGZ1bmN0aW9uKCl7CiAgY29uc3QgY2FwPWlzQ2FwdHVyZUNvbnRleHQxMzgoKTsKICBjb25zdCByZXM9YXdhaXQgc3RhcnQxMzguYXBwbHkodGhpcyxhcmd1bWVudHMpOwogIGlmKGNhcCl7CiAgICBzZXRUaW1lb3V0KCgpPT57CiAgICAgIHRyeXsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic2hlZXQiKSYmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzaGVldCIpLnN0eWxlLmRpc3BsYXk9Im5vbmUiKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgibWVudSIpJiYoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIm1lbnUiKS5zdHlsZS5kaXNwbGF5PSJibG9jayIpOwogICAgICAgIHJlbmRlckNhcHR1cmVXb3JsZEh1YigpOwogICAgICAgIGNvbnN0IGh1Yj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY2FwdHVyZUdhbWVIdWIiKTsKICAgICAgICBpZihodWIpe2h1Yi5zdHlsZS5kaXNwbGF5PSJibG9jayI7aHViLnNjcm9sbEludG9WaWV3KHtibG9jazoic3RhcnQifSl9CiAgICAgIH1jYXRjaChlKXt9CiAgICB9LDMwKTsKICB9CiAgcmV0dXJuIHJlczsKfTsKCg==')
assert len(old)==724 and before.count(old)==1,'non unique Capture138 seam'
after=before.replace(old,b'',1)
assert len(after)==8164674 and blob(after)=='644fc5d0ce5fd195c5496d42cc0204bd1f9a9831','candidate drift'
assert after.replace(b'/* ---------- traduction propre des \xc3\xa9l\xc3\xa9ments ---------- */',old+b'/* ---------- traduction propre des \xc3\xa9l\xc3\xa9ments ---------- */',1)==before,'rollback byte-exact failed'
f.write_bytes(after)
print('Capture138 strict seam',len(before),blob(before),'->',len(after),blob(after),'rollback GREEN')
