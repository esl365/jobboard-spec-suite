# Gemini Specification Template

> **Note**: This template is for reference only. Gemini automatically generates specifications from GitHub Issues. You don't need to create these files manually.

---

## Auto-Generated Spec Structure

When Gemini analyzes an Issue, it creates:

### 1. OpenAPI Specification

```yaml
# spec-updates/openapi.yaml

paths:
  /api/v1/resource:
    get:
      summary: Get resource
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Resource'
    post:
      summary: Create resource
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string

components:
  schemas:
    Resource:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        created_at:
          type: string
          format: date-time
```

### 2. Database Schema

```sql
-- spec-updates/migration.sql

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_name ON resources(name);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Policy Updates

```markdown
# specs/policy.md additions

## Resource Management Policy

### Access Control
- Resources are user-scoped
- Users can only access their own resources
- Admin can access all resources

### Validation
- Name: required, max 255 chars
- Description: optional, max 5000 chars

### Limits
- Max resources per user: 1000
- Rate limit: 100 requests/minute
```

### 4. Task Breakdown

```markdown
## Task Assignments

**Estimated Total: 6 hours**

### P{number}-claude-resource-backend (4h)
**Agent**: Claude Code
**Priority**: High
**Type**: Backend Development

**Tasks**:
1. Database Setup (1h)
   - Create migration file
   - Run migration
   - Verify schema

2. API Implementation (2h)
   - GET /api/v1/resources
   - POST /api/v1/resources
   - PUT /api/v1/resources/:id
   - DELETE /api/v1/resources/:id

3. Business Logic (0.5h)
   - Validation
   - Authorization
   - Error handling

4. Tests (0.5h)
   - Unit tests (>85% coverage)
   - Integration tests

### P{number+1}-codex-resource-ui (2h)
**Agent**: Codex
**Priority**: High
**Type**: Frontend Development
**Depends On**: P{number} (backend API)

**Tasks**:
1. Components (1h)
   - ResourceList
   - ResourceCard
   - ResourceForm
   - DeleteConfirmation

2. API Integration (0.5h)
   - React Query setup
   - CRUD operations
   - Error handling

3. Styling (0.5h)
   - Responsive design
   - Loading states
   - Empty states
```

### 5. Code Skeleton

```typescript
// src/controllers/ResourceController.ts
import { Request, Response } from 'express';
import { ResourceService } from '../services/ResourceService';

export class ResourceController {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const resources = await this.resourceService.getAllByUser(userId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { name, description } = req.body;

      // TODO: Validation

      const resource = await this.resourceService.create({
        userId,
        name,
        description
      });

      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // TODO: update, delete methods
}

// src/services/ResourceService.ts
export class ResourceService {
  async getAllByUser(userId: number) {
    // TODO: Implement
  }

  async create(data: { userId: number; name: string; description?: string }) {
    // TODO: Implement
  }

  // TODO: update, delete, getById methods
}

// src/components/ResourceList.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export const ResourceList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resources'],
    queryFn: fetchResources
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="resource-list">
      {/* TODO: Render resources */}
    </div>
  );
};

async function fetchResources() {
  // TODO: API call
}
```

---

## How It Works

1. **Issue Created** → GitHub Action triggers
2. **Gemini Analyzes** → Generates specifications
3. **PR Created** → Spec update PR with all files
4. **User Reviews** → Approve specification PR
5. **Prompts Generated** → Tasks for Claude/Codex
6. **LLMs Implement** → Based on specs
7. **Gemini Verifies** → Spec drift check on implementation PR

---

## Example Workflow

```
Day 1, 09:00 [User]
  └─ Create Issue: "Add resource management"

Day 1, 09:05 [Gemini] - Automatic
  ├─ Analyze issue
  ├─ Generate OpenAPI spec
  ├─ Design database schema
  ├─ Write policy additions
  ├─ Break down tasks
  ├─ Create code skeletons
  └─ Create PR: "spec: resource management"

Day 1, 09:10 [User]
  └─ Review & Approve spec PR (5 min)

Day 1, 10:00 [Claude + Codex] - Automatic
  ├─ Implement backend (Claude, 4h)
  └─ Implement frontend (Codex, 2h, parallel)

Day 1, 14:30 [Claude]
  └─ Create implementation PR

Day 1, 14:35 [Gemini + ChatGPT] - Automatic
  ├─ Spec drift check (Gemini)
  └─ Code review (ChatGPT)

Day 1, 16:00 [Claude] - Automatic
  └─ Fix issues from reviews

Day 2, 09:00 [User]
  └─ Approve & Merge (5 min)
```

---

## Benefits

✅ **No manual spec writing** - Gemini does it
✅ **Consistent structure** - Always follows standards
✅ **Complete coverage** - API, DB, Policy, Code
✅ **Immediate validation** - Specs reviewed before coding
✅ **100% compliance** - Drift detection ensures match

---

## Related

- `docs/4LLM_HYBRID_SUMMARY.md` - 4-LLM system overview
- `scripts/gemini-analyze-issue.mjs` - Gemini issue analyzer
- `scripts/gemini-analyze-drift.mjs` - Gemini drift analyzer
- `.github/workflows/gemini-spec-manager.yml` - Automation workflow
