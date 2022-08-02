#!/bin/bash

mysqldump --user=$MYSQL_USER --password=$MYSQL_PASSWORD --result-file=/data/dump.sql  --host=$DB_HOST --skip-comments --complete-insert --skip-extended-insert $MYSQL_DATABASE
