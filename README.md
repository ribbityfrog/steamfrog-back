# Creation commands

## Fork

To fork from github
 - Clone this repository somewhere
 - Create a new repistory from github, then :
```bash
git remote set-url origin https://github.com/LastExile/NEWPROJECT.git
git push -u origin main
```

## Setup

### Docker Postgres for local development

```bash
    docker run --name adonisbase-postgres -p 8080:5432 -e POSTGRES_PASSWORD=adonisbase -e POSTGRES_USER=adonis -e POSTGRES_DB=dbase -d postgres
```
You can replace the username, password and db name by your own
