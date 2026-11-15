import type * as ApiTypes from '@codeimage/api/api-types';
import {randUuid} from '@ngneat/falso';
import {get, set} from 'idb-keyval';
import {http, HttpResponse, type RequestHandler} from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const STORAGE_KEY = 'mswjs-signatures';
/** The API's default SIGNATURES_LIMIT. */
const LIMIT = Number(import.meta.env.VITE_SIGNATURE_LIMIT ?? 3);

type Row = ApiTypes.GetSignatureByIdApi['response'] & {ownerId: string};

let rows: Row[] = [];

export async function hydrateSignatures() {
  rows = (await get<Row[]>(STORAGE_KEY)) ?? [];
}

const persist = () => set(STORAGE_KEY, rows);
const ownerOf = (request: Request) =>
  request.headers.get('auth-mock-user-id') ?? 'default-user';
const response = ({ownerId: _, ...row}: Row) => row;
const notFound = (id: string) =>
  HttpResponse.json(
    {
      code: 'NotFoundSignatureException',
      message: `Signature with id ${id} not found`,
      statusCode: 404,
    },
    {status: 404},
  );

const handlers: RequestHandler[] = [
  http.get(`${BASE_URL}/api/v1/signature`, ({request}) => {
    const ownerId = ownerOf(request);
    return HttpResponse.json(
      rows.filter(row => row.ownerId === ownerId).map(response),
    );
  }),
  http.post(`${BASE_URL}/api/v1/signature`, async ({request}) => {
    const ownerId = ownerOf(request);
    const body = (await request.json()) as NonNullable<
      ApiTypes.CreateSignatureApi['request']['body']
    >;
    if (rows.filter(row => row.ownerId === ownerId).length >= LIMIT)
      return HttpResponse.json(
        {
          code: 'ExceedSignatureLimitException',
          message: 'Signature limit per account exceeded',
          statusCode: 422,
        },
        {status: 422},
      );
    if (body.isDefault)
      rows = rows.map(row =>
        row.ownerId === ownerId ? {...row, isDefault: false} : row,
      );
    const now = new Date().toISOString();
    const row: Row = {
      id: randUuid(),
      ownerId,
      name: body.name,
      isDefault: body.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
      version: 1,
      data: body.data,
    };
    rows = [...rows, row];
    await persist();
    return HttpResponse.json(response(row));
  }),
  http.put(`${BASE_URL}/api/v1/signature/:id`, async ({request, params}) => {
    const ownerId = ownerOf(request);
    const id = params['id'] as string;
    const row = rows.find(item => item.id === id && item.ownerId === ownerId);
    if (!row) return notFound(id);
    const body = (await request.json()) as NonNullable<
      ApiTypes.UpdateSignatureApi['request']['body']
    >;
    const updated: Row = {
      ...row,
      name: body.name ?? row.name,
      data: body.data ?? row.data,
      isDefault: body.isDefault ?? row.isDefault,
      version: row.version + 1,
      updatedAt: new Date().toISOString(),
    };
    rows = rows.map(item => {
      if (item.id === id) return updated;
      return body.isDefault && item.ownerId === ownerId
        ? {...item, isDefault: false}
        : item;
    });
    await persist();
    return HttpResponse.json(response(updated));
  }),
  http.delete(`${BASE_URL}/api/v1/signature/:id`, async ({request, params}) => {
    const ownerId = ownerOf(request);
    const id = params['id'] as string;
    const row = rows.find(item => item.id === id && item.ownerId === ownerId);
    if (!row) return notFound(id);
    rows = rows.filter(item => item.id !== id);
    await persist();
    return HttpResponse.json(response(row));
  }),
];

export default handlers;
