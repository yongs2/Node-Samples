#!/bin/bash

INPUT="sms_bulk.sql"

DB_HOST=192.168.0.210
DB_PORT=3307
DB_USER=agent
DB_PASS=agent.123
DB_NAME=AGENT_DB

if [ -f ${INPUT} ] ; then
	echo "query  ${INPUT}"
	mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASS} ${DB_NAME} < ${INPUT}
fi
# end of script