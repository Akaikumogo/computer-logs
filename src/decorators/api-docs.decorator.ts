import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

export interface ApiDocsOptions {
  summary?: string;
  description?: string;
  tags?: string[];
  responses?: { [key: string]: { description: string; type?: any } };
  params?: { name: string; description: string; required?: boolean }[];
  queries?: {
    name: string;
    description: string;
    required?: boolean;
    type?: string;
  }[];
  body?: { type: any; description?: string };
  auth?: boolean;
}

export function ApiDocs(options: ApiDocsOptions) {
  const decorators: any[] = [];

  // Add tags
  if (options.tags && options.tags.length > 0) {
    decorators.push(ApiTags(...options.tags));
  }

  // Add authentication
  if (options.auth) {
    decorators.push(ApiBearerAuth());
  }

  // Add operation
  decorators.push(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  );

  // Add parameters
  if (options.params) {
    options.params.forEach((param) => {
      decorators.push(
        ApiParam({
          name: param.name,
          description: param.description,
          required: param.required ?? true,
        }),
      );
    });
  }

  // Add query parameters
  if (options.queries) {
    options.queries.forEach((query) => {
      decorators.push(
        ApiQuery({
          name: query.name,
          description: query.description,
          required: query.required ?? false,
          type: query.type as any,
        }),
      );
    });
  }

  // Add request body
  if (options.body) {
    decorators.push(
      ApiBody({
        type: options.body.type,
        description: options.body.description,
      }),
    );
  }

  // Add responses
  if (options.responses) {
    Object.entries(options.responses).forEach(([statusCode, response]) => {
      decorators.push(
        ApiResponse({
          status: parseInt(statusCode),
          description: response.description,
          type: response.type,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}

// Common response decorators
export const ApiSuccessResponse = (description: string, type?: any) =>
  ApiResponse({
    status: 200,
    description,
    type,
  });

export const ApiCreatedResponse = (description: string, type?: any) =>
  ApiResponse({
    status: 201,
    description,
    type,
  });

export const ApiBadRequestResponse = (description: string = 'Bad Request') =>
  ApiResponse({
    status: 400,
    description,
  });

export const ApiUnauthorizedResponse = (description: string = 'Unauthorized') =>
  ApiResponse({
    status: 401,
    description,
  });

export const ApiForbiddenResponse = (description: string = 'Forbidden') =>
  ApiResponse({
    status: 403,
    description,
  });

export const ApiNotFoundResponse = (description: string = 'Not Found') =>
  ApiResponse({
    status: 404,
    description,
  });

export const ApiInternalServerErrorResponse = (
  description: string = 'Internal Server Error',
) =>
  ApiResponse({
    status: 500,
    description,
  });

// Common operation decorators
export const ApiGet = (summary: string, description?: string) =>
  ApiDocs({
    summary,
    description,
    responses: {
      '200': { description: 'Success' },
      '400': { description: 'Bad Request' },
      '401': { description: 'Unauthorized' },
      '500': { description: 'Internal Server Error' },
    },
  });

export const ApiPost = (
  summary: string,
  description?: string,
  bodyType?: any,
) =>
  ApiDocs({
    summary,
    description,
    body: bodyType ? { type: bodyType } : undefined,
    responses: {
      '201': { description: 'Created' },
      '400': { description: 'Bad Request' },
      '401': { description: 'Unauthorized' },
      '500': { description: 'Internal Server Error' },
    },
  });

export const ApiPut = (summary: string, description?: string, bodyType?: any) =>
  ApiDocs({
    summary,
    description,
    body: bodyType ? { type: bodyType } : undefined,
    responses: {
      '200': { description: 'Updated' },
      '400': { description: 'Bad Request' },
      '401': { description: 'Unauthorized' },
      '404': { description: 'Not Found' },
      '500': { description: 'Internal Server Error' },
    },
  });

export const ApiDelete = (summary: string, description?: string) =>
  ApiDocs({
    summary,
    description,
    responses: {
      '200': { description: 'Deleted' },
      '401': { description: 'Unauthorized' },
      '404': { description: 'Not Found' },
      '500': { description: 'Internal Server Error' },
    },
  });
