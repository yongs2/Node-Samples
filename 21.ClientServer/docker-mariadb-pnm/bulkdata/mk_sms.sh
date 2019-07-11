#!/bin/bash

OUTPUT="sms_bulk.sql"
NUM_SRT=00001
NUM_END=00100

if [ -f ${OUTPUT} ] ; then
        echo "rm -f ${OUTPUT}"
        rm -f ${OUTPUT}
fi

echo "Generate ${OUTPUT}, ${NUM_SRT}~${NUM_END}"
for (( SEQ=NUM_SRT; SEQ<=NUM_END; SEQ++ ))
do
        printf "insert into TBL_SEND_SMS (MSG_KEY, CALLEE_NO, CALLBACK_NO, SMS_MSG, PROC_STS, CALLER_NO, ORDER_FLAG)\n" >> ${OUTPUT}
        printf "select case count(*) when 0 then 1 else max(msg_key) + 1 end, '010000%05d', '010000%05d', 'SMSSMSSMSSMSTEST입니다 에스엠에스 SMS 1 ', 0, '010000%05d',0 from TBL_SEND_SMS;\n" ${SEQ} ${SEQ} ${SEQ} >> ${OUTPUT}
done
# end of script