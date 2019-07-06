#!/bin/bash

BUCKET=${BUCKET}
TEST_URL=http://localhost:4572/$BUCKET
WAIT_SLEEP=2
WAIT_LOOPS=10

echo "$(date) - waiting for $TEST_URL"
# wait until is ready
i=0
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' $TEST_URL)" != "200" ]]; do
    i=`expr $i + 1`
    if [ $i -ge $WAIT_LOOPS ]; then
        echo "$(date) - still not ready, giving up"
        exit 1
    fi
    echo "$(date) - waiting to be ready"
    sleep $WAIT_SLEEP
done

# exit normally
echo "$(date) - ready"
exit 0
