# REST API Plan

## 1. Resources

- **Users**: Managed by Supabase Auth
- **Travel Projects**: Corresponds to `travel_projects` table
- **Notes**: Corresponds to `notes` table
- **Config Data**: Corresponds to `config_data` table
- **Note Tags**: Corresponds to `note_tags` table
- **Travel Plans**: Corresponds to `travel_plans` table

## 2. Endpoints

### Travel Projects

#### List Projects

- **Method**: GET
- **Path**: `/projects`
- **Description**: Get all travel projects for the authenticated user
- **Query Parameters**:
  - `sort_by`: [created_at, updated_at, name] (default: updated_at)
  - `order`: [asc, desc] (default: desc)
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "last_notes_update_at": "timestamp",
        "has_config_note": "boolean"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "pages": "integer"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Get Project

- **Method**: GET
- **Path**: `/projects/{id}`
- **Description**: Get a specific travel project
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "last_notes_update_at": "timestamp",
    "has_config_note": "boolean"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Create Project

- **Method**: POST
- **Path**: `/projects`
- **Description**: Create a new travel project
- **Request Body**:
  ```json
  {
    "name": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "last_notes_update_at": "timestamp",
    "has_config_note": "boolean"
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized

#### Update Project

- **Method**: PATCH
- **Path**: `/projects/{id}`
- **Description**: Update a travel project
- **Request Body**:
  ```json
  {
    "name": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "last_notes_update_at": "timestamp",
    "has_config_note": "boolean"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Delete Project

- **Method**: DELETE
- **Path**: `/projects/{id}`
- **Description**: Delete a travel project
- **Response Body**: None
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### Notes

#### List Notes

- **Method**: GET
- **Path**: `/projects/{project_id}/notes`
- **Description**: Get all notes for a specific project
- **Query Parameters**:
  - `sort_by`: [position, priority, created_at, updated_at, title] (default: position)
  - `order`: [asc, desc] (default: asc for position, desc for others)
  - `tag`: Filter by tag name
  - `search`: Search in title and content
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "title": "string",
        "content": "string",
        "is_config_note": "boolean",
        "position": "integer",
        "priority": "integer",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "tags": ["string"]
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Get Note

- **Method**: GET
- **Path**: `/projects/{project_id}/notes/{note_id}`
- **Description**: Get a specific note
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "is_config_note": "boolean",
    "position": "integer",
    "priority": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "tags": ["string"],
    "config_data": {
      "arrival_date": "date",
      "departure_date": "date",
      "num_days": "integer",
      "num_people": "integer"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Create Regular Note

- **Method**: POST
- **Path**: `/projects/{project_id}/notes`
- **Description**: Create a new note
- **Request Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "priority": "integer",
    "tags": ["string"]
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "is_config_note": false,
    "position": "integer",
    "priority": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "tags": ["string"]
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Create Config Note

- **Method**: POST
- **Path**: `/projects/{project_id}/config-note`
- **Description**: Create the configuration note for a project
- **Request Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "arrival_date": "date",
    "departure_date": "date",
    "num_days": "integer",
    "num_people": "integer"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "is_config_note": true,
    "position": "integer",
    "priority": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "tags": ["string"],
    "config_data": {
      "arrival_date": "date",
      "departure_date": "date",
      "num_days": "integer",
      "num_people": "integer"
    }
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict (Config note already exists)

#### Update Note

- **Method**: PATCH
- **Path**: `/projects/{project_id}/notes/{note_id}`
- **Description**: Update a note
- **Request Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "priority": "integer",
    "tags": ["string"]
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "is_config_note": "boolean",
    "position": "integer",
    "priority": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "tags": ["string"]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Update Config Note

- **Method**: PATCH
- **Path**: `/projects/{project_id}/config-note`
- **Description**: Update the configuration note
- **Request Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "arrival_date": "date",
    "departure_date": "date",
    "num_days": "integer",
    "num_people": "integer"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "is_config_note": true,
    "position": "integer",
    "priority": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "tags": ["string"],
    "config_data": {
      "arrival_date": "date",
      "departure_date": "date",
      "num_days": "integer",
      "num_people": "integer"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Delete Note

- **Method**: DELETE
- **Path**: `/projects/{project_id}/notes/{note_id}`
- **Description**: Delete a note
- **Response Body**: None
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Reorder Notes

- **Method**: POST
- **Path**: `/projects/{project_id}/notes/reorder`
- **Description**: Update the position of multiple notes
- **Request Body**:
  ```json
  {
    "note_positions": [
      {
        "id": "uuid",
        "position": "integer"
      }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

### Travel Plans

#### List Plans

- **Method**: GET
- **Path**: `/projects/{project_id}/plans`
- **Description**: Get all travel plans for a specific project
- **Query Parameters**:
  - `include_outdated`: boolean (default: false)
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "version_name": "string",
        "is_outdated": "boolean",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Get Plan

- **Method**: GET
- **Path**: `/projects/{project_id}/plans/{plan_id}`
- **Description**: Get a specific travel plan
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "version_name": "string",
    "content": {
      "days": [
        {
          "day_number": "integer",
          "date": "date",
          "activities": [
            {
              "time": "string",
              "name": "string",
              "description": "string",
              "type": "string"
            }
          ]
        }
      ]
    },
    "is_outdated": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Generate Plan

- **Method**: POST
- **Path**: `/projects/{project_id}/plans/generate`
- **Description**: Generate a travel plan based on project notes
- **Request Body**:
  ```json
  {
    "version_name": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "version_name": "string",
    "content": {
      "days": [
        {
          "day_number": "integer",
          "date": "date",
          "activities": [
            {
              "time": "string",
              "name": "string",
              "description": "string",
              "type": "string"
            }
          ]
        }
      ]
    },
    "is_outdated": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict (Version name already exists)

#### Update Plan

- **Method**: PATCH
- **Path**: `/projects/{project_id}/plans/{plan_id}`
- **Description**: Update a travel plan
- **Request Body**:
  ```json
  {
    "version_name": "string",
    "content": {
      "days": [
        {
          "day_number": "integer",
          "date": "date",
          "activities": [
            {
              "time": "string",
              "name": "string",
              "description": "string",
              "type": "string"
            }
          ]
        }
      ]
    }
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "version_name": "string",
    "content": {
      "days": [
        {
          "day_number": "integer",
          "date": "date",
          "activities": [
            {
              "time": "string",
              "name": "string",
              "description": "string",
              "type": "string"
            }
          ]
        }
      ]
    },
    "is_outdated": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict (Version name already exists)

#### Delete Plan

- **Method**: DELETE
- **Path**: `/projects/{project_id}/plans/{plan_id}`
- **Description**: Delete a travel plan
- **Response Body**: None
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Export Plan to PDF

- **Method**: GET
- **Path**: `/projects/{project_id}/plans/{plan_id}/export`
- **Description**: Export a travel plan to PDF
- **Query Parameters**:
  - `format`: [pdf] (default: pdf)
- **Response Body**: Binary PDF file
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Compare Plans

- **Method**: GET
- **Path**: `/projects/{project_id}/plans/compare`
- **Description**: Compare two travel plans
- **Query Parameters**:
  - `plan1_id`: uuid
  - `plan2_id`: uuid
- **Response Body**:
  ```json
  {
    "plan1": {
      "id": "uuid",
      "version_name": "string"
    },
    "plan2": {
      "id": "uuid",
      "version_name": "string"
    },
    "differences": [
      {
        "day": "integer",
        "plan1_activities": [
          {
            "time": "string",
            "name": "string",
            "description": "string",
            "type": "string"
          }
        ],
        "plan2_activities": [
          {
            "time": "string",
            "name": "string",
            "description": "string",
            "type": "string"
          }
        ]
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

## 3. Authentication and Authorization

- **Authentication Mechanism**: JWT-based authentication managed by Supabase Auth
- **Implementation Details**:
  - All API endpoints except authentication endpoints require a valid JWT
  - JWT is sent in the Authorization header as "Bearer {token}"
  - Supabase RLS (Row Level Security) policies ensure users can only access their own data
  - Automatic token refresh handled by Supabase client

## 4. Validation and Business Logic

### Users

- Email must be a valid email format
- Password must meet minimum security requirements (8+ characters, mix of letter types and numbers)

### Travel Projects

- Project name is required and must be between 3-100 characters
- Each user can have up to 50 active projects

### Notes

- Note title is required and must be between 3-200 characters
- Note position must be a non-negative integer
- Note priority must be between 0-10
- Only one configuration note is allowed per project
- Tags must be alphanumeric plus hyphens and underscores, max 30 characters each
- A note can have up to 20 tags

### Config Data

- Arrival date and departure date are required
- Departure date must be after arrival date
- Number of days must match the difference between arrival and departure dates
- Number of people must be between 1-50

### Travel Plans

- Version name is required and must be between 1-50 characters
- Version names must be unique within a project
- Content must be valid JSON and conform to the plan structure
- When notes are updated, existing plans are marked as outdated

### Plan Generation

- A project must have a configuration note before a plan can be generated
- The plan must follow the required structure (days > activities)
- Days must align with the arrival and departure dates in the configuration note
