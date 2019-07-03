#!/bin/sh

openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
openssl req -new -key private.pem -out private.csr -config generate_crt.conf
openssl req -x509 -days 365 -key private.pem -in private.csr -out mycommoncrt.crt -days 365 -config generate_crt.conf
openssl req -x509 -days 365 -key private.pem -in private.csr -out mycommoncrt.crt -days 365 -config generate_crt.conf -extensions req_ext
