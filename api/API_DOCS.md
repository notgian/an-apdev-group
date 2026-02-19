# 6-7-Ate-9 API
This API will be responsible for communicating with the database for all CRUD operations related to the application.

## Return messages
All return messages will be in the format of a JSON object. This object format is consistent for all messages returned by the API regardless of the operaration.

```
{
    "status": HTTP_STATUS_CODE,
    "message": CUSTOM_MESSAGE
    "data" : {} // data in key-value paris
} 
```
The return object will always contain a `status` code, `message`, and `data`. The status code and message must have a value (i.e. status 200, message OK), however, data MAY be null or undefined if there is no data to return.

In the event there is data returned in an error message, it shall be returned in the `data` field.
