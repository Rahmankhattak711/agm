import swaggerJsdoc from "swagger-jsdoc";

export const getApiDocs = async () => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "A G M FITOUT Accounting API",
        version: "1.0.0",
        description:
          "API documentation for Accounting, User Auth, and Financial Modules",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
    apis: ["./app/api/**/*.ts"],
  };

  const spec: any = swaggerJsdoc(options);

  const manualSchemas = {
    SigninRequest: {
      type: "object",
      properties: { email: { type: "string" }, password: { type: "string" } },
      required: ["email", "password"],
    },
    SignupRequest: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        role: { type: "string" },
      },
      required: ["fullName", "email", "password"],
    },
    TokenResponse: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
      },
    },
    RefreshRequest: {
      type: "object",
      properties: { refreshToken: { type: "string" } },
      required: ["refreshToken"],
    },
    SignoutRequest: {
      type: "object",
      properties: {
        refreshToken: { type: "string" },
        all: { type: "boolean" },
      },
    },
    JournalEntryLine: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        debit: { type: "number" },
        credit: { type: "number" },
      },
      required: ["accountId"],
    },
    JournalEntryRequest: {
      type: "object",
      properties: {
        entryNumber: { type: "string" },
        entryDate: { type: "string", format: "date" },
        description: { type: "string" },
        reference: { type: "string" },
        createdBy: { type: "string" },
        lines: {
          type: "array",
          items: { $ref: "#/components/schemas/JournalEntryLine" },
        },
      },
      required: ["entryNumber", "entryDate", "createdBy", "lines"],
    },
    LedgerQuery: {
      type: "object",
      properties: { accountId: { type: "string" } },
      required: ["accountId"],
    },
    Asset: {
      type: "object",
      properties: {
        assetCode: { type: "string" },
        assetName: { type: "string" },
        purchaseDate: { type: "string" },
        cost: { type: "number" },
      },
    },
    DepreciationRequest: {
      type: "object",
      properties: {
        fiscalYear: { type: "integer" },
        createdBy: { type: "string" },
      },
    },
    PettyCashRequest: {
      type: "object",
      properties: {
        transactionDate: { type: "string" },
        voucherNumber: { type: "string" },
        category: { type: "string" },
        amount: { type: "number" },
        transactionType: { type: "string" },
      },
      required: [
        "transactionDate",
        "voucherNumber",
        "category",
        "amount",
        "transactionType",
      ],
    },
    Employee: {
      type: "object",
      properties: {
        employeeCode: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        joiningDate: { type: "string" },
        basicSalary: { type: "number" },
      },
      required: [
        "employeeCode",
        "firstName",
        "lastName",
        "joiningDate",
        "basicSalary",
      ],
    },
  };

  const manualPaths = {
    "/api/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "Sign in user",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SigninRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Sign up new user",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/signout": {
      post: {
        tags: ["Auth"],
        summary: "Sign out (revoke refresh token)",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignoutRequest" },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/journal-entries": {
      post: {
        tags: ["Journal Entries"],
        summary: "Create a journal entry (double-entry validation)",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/JournalEntryRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/reports/ledger": {
      get: {
        tags: ["Reports"],
        summary: "Ledger for an account",
        parameters: [
          {
            name: "accountId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/reports/trial-balance": {
      get: {
        tags: ["Reports"],
        summary: "Trial balance",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/reports/profit-loss": {
      get: {
        tags: ["Reports"],
        summary: "Profit & Loss",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/reports/balance-sheet": {
      get: {
        tags: ["Reports"],
        summary: "Balance Sheet",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/reports/vat-summary": {
      get: {
        tags: ["Reports"],
        summary: "VAT Summary",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/assets": {
      post: {
        tags: ["Fixed Assets"],
        summary: "Create asset",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Asset" },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
      get: {
        tags: ["Fixed Assets"],
        summary: "List assets",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/assets/depreciate": {
      post: {
        tags: ["Fixed Assets"],
        summary: "Run depreciation job",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DepreciationRequest" },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/petty-cash": {
      post: {
        tags: ["Petty Cash"],
        summary: "Create petty cash transaction",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PettyCashRequest" },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
      get: {
        tags: ["Petty Cash"],
        summary: "List petty cash transactions",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employees",
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: ["Employees"],
        summary: "Create employee",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Employee" },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
      patch: {
        tags: ["Employees"],
        summary: "Update employee",
        requestBody: {
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Employees"],
        summary: "Delete employee",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
              },
            },
          },
        },
        responses: { "200": { description: "Deleted" } },
      },
    },
  };

  spec.paths = { ...(spec.paths || {}), ...manualPaths };
  spec.components = spec.components || {};
  spec.components.schemas = {
    ...(spec.components.schemas || {}),
    ...manualSchemas,
  };

  return spec;
};
