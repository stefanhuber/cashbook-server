# shario server

## API

| Method | Path | Params | Description | Login |
| --- | --- | --- | --- | --- |
| POST | /members/register | <ul><li>username:string</li><li>email:string</li><li>password:string</li><li>confirmPassword:string</li></ul> | create new member | NO |
| POST | /members/login | <ul><li>username:string</li><li>password:string</li></ul> | login member | NO |
| POST | /projects | <ul><li>name:string</li></ul> | create a new project | YES |
| GET | /projects |  | list all projects of a member | YES |
| POST | /projects/:id/members | <ul><li>member:string</li></ul> | project owner can add members | YES |
