# P2P Service API


## Requirements
- Node 14 LTS
- Redis 6
- MySQL (Aurora Compatible) version v5.7.*
- Docker (require for run tests)

## Installations
Please request the .env to backend developers.
For now everyone can use docker or run it directly using yarn.

1. Clone the repository
```bash
via ssh: git clone git@github.com:FassetIO/p2p-service.git
via https: git clone https://github.com/FassetIO/p2p-service.git
```
2. Move to project
```bash
cd p2p-service
```
3. Install dependencies
```bash
yarn install
```
4. Set up your .env file, just copying the defaults from .env.example to .env then fill all the variable
```bash
cp .env.example .env
nano .env
```
5. Run the server on Local
```bash
yarn run dev
```

## Setup Tests
Setup only once for the first time.

1. Change several value in .env first, because we will set the value same like with docker container
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3307 or port_you_want
MYSQL_PASSWORD=password_you_want
```
2. Create container for p2p-db
```bash
yarn db:start
```
3. Check container created or not
```bash
docker ps
```
4. Create database & import data to mysql container
```bash
yarn db:reset
```
5. Login into container
```bash
docker exec -it p2p-db bash
```
6. Login into mysql in container
```bash
mysql -u$MYSQL_USER -p$MYSQL_PASSWORD
```
7. Check to make sure database that already imported with these command
```bash
- show databases;
- use db_name;
- show tables;
```
8. Run test
```bash
yarn test
```
9. [Optional] If you want to stop the container running, run this
```bash
yarn db:stop
```

## How if i want to update a column or add new table?
In this case i want to create new migration which focus on add new column.
1. Make sure your docker database has no change (i mean the data is default)
```bash
yarn db:reset
```
2. Create a migration file for add new column
```bash
yarn sequelize migration:create —name add-column-to-table
```
3. Do code change in file that already generated. Need documentation? Read sequelize docs [here](https://sequelize.org/docs/v6/other-topics/migrations/)
4. Implement migration to our database
```bash
yarn sequelize db:migrate
```
5. If implement some column success, we have to set also to our dump.sql
```bash
yarn db:dump
```

## Additional
If you need help about sequelize, you can use
```bash
yarn sequelize --help
```
If you want to implement some changes to docker database
```bash
yarn db:dump
```
