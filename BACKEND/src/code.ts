/*
==================== HTTP STATUS CODES (BACKEND USE) ====================

200 OK
- Successful request
- Data fetched / login success / normal response

201 Created
- New resource created
- Signup, create folder, upload resume

204 No Content
- Success but no response body
- Delete success (optional)

-----------------------------------------------------------------------

400 Bad Request
- Missing required fields
- Invalid input / malformed request
- Invalid ObjectId / invalid query params

401 Unauthorized
- No JWT token
- Invalid or expired token
- User not logged in

403 Forbidden
- User authenticated but not allowed
- Role-based access denied

404 Not Found
- User not found
- Folder / resource does not exist

409 Conflict
- Duplicate data
- Username already exists
- Email already exists

-----------------------------------------------------------------------

422 Unprocessable Entity
- Valid request format but invalid logic
- Password too weak
- Invalid business rules

-----------------------------------------------------------------------

500 Internal Server Error
- Server crash
- Unhandled exceptions
- Database failure

502 Bad Gateway
- External API failure

503 Service Unavailable
- Server down / overloaded

=======================================================================
*/
