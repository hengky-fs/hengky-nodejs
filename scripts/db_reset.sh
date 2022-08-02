#!/bin/bash

# Drop database
echo "DROP DATABASE IF EXISTS ${MYSQL_DB};" | mysql --user=$MYSQL_USER --password=$MYSQL_PASSWORD --host=$MYSQL_HOST --port=$MYSQL_PORT

# Create database
echo "CREATE DATABASE ${MYSQL_DB};" | mysql --user=$MYSQL_USER --password=$MYSQL_PASSWORD --host=$MYSQL_HOST --port=$MYSQL_PORT

# Import from dump file
mysql --user=$MYSQL_USER --password=$MYSQL_PASSWORD --host=$MYSQL_HOST --port=$MYSQL_PORT $MYSQL_DB < ./data/dump.sql
