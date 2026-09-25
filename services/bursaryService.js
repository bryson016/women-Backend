/** Bursary service (Prisma/PostgreSQL).
 * Applications and uploaded documents are owned by the authenticated user
 * (`userId`). Document bytes are persisted in PostgreSQL so uploaded files
 * are durable and visible in the Neon database, not just on the device.
 */
const { prisma } = require('../prisma/client');
const { ApiError } = require('../utils/asyncHandler');

const DOCUMENT_REQUIREMENTS = new Set([
  'idDocument',
  'admissionLetter',
  'feesStructure',
  'academicResult',
  'parentId',
  'incomeProof',
  'bankStatement',
]);
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function toPublic(application) {
  if (!application) return application;
  const { userId, data, ...rest } = application;
  const formFields = data && typeof data === 'object' ? data : {};
  return { ...formFields, ...rest };
}

function publicDocument(document, baseUrl) {
  return {
    id: document.id,
    documentType: document.documentType,
    name: document.fileName,
    type: document.mimeType,
    fileSize: document.fileSize,
    url: `${baseUrl}/bursary/documents/${document.id}/content`,
    uploadedAt: document.createdAt,
  };
}

function assertValidDocument(file, documentType) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new ApiError(400, 'Please select a document to upload.');
  }
  if (!DOCUMENT_REQUIREMENTS.has(documentType)) {
    throw new ApiError(400, 'Invalid bursary document type.');
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new ApiError(413, 'Each document must be 10 MB or smaller.');
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError(400, 'Only PDF and image documents are supported.');
  }
}

function absoluteUrl(req, pathname) {
  const configured = process.env.PUBLIC_API_URL;
  if (configured) return `${configured.replace(/\/+$/, '')}${pathname}`;
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}${pathname}`;
}

async function uploadDocument(req, userId) {
  const documentType = String(req.body?.documentType || '');
  const file = req.file;
  assertValidDocument(file, documentType);

  const document = await prisma.bursaryDocument.create({
    data: {
      userId,
      documentType,
      fileName: file.originalname || 'document',
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: file.buffer,
    },
  });

  return {
    message: 'Document uploaded successfully',
    document: publicDocument(document, absoluteUrl(req, '')),
  };
}

async function apply(data, userId) {
  const formData = data && typeof data === 'object' ? data : {};
  const documentIds = (formData.documentIds || [])
    .flatMap((value) => String(value).split(','))
    .map((value) => Number.parseInt(value, 10))
    .filter(Number.isInteger);
  const uniqueDocumentIds = [...new Set(documentIds)];

  const ownedDocuments = uniqueDocumentIds.length
    ? await prisma.bursaryDocument.findMany({
        where: { id: { in: uniqueDocumentIds }, userId },
        select: { id: true },
      })
    : [];
  const ownedDocumentIds = new Set(ownedDocuments.map((document) => document.id));
  if (ownedDocumentIds.size !== uniqueDocumentIds.length) {
    throw new ApiError(400, 'One or more uploaded documents are invalid.');
  }

  const newApplication = await prisma.bursaryApplication.create({
    data: {
      userId,
      status: 'Pending',
      applicationCode: `BUR-${Date.now().toString(36).toUpperCase()}`,
      data: { ...formData, documentIds: [...ownedDocumentIds] },
    },
  });

  if (ownedDocumentIds.size) {
    await prisma.bursaryDocument.updateMany({
      where: { id: { in: [...ownedDocumentIds] }, userId, applicationId: null },
      data: { applicationId: newApplication.id },
    });
  }

  return {
    message: 'Bursary application submitted successfully',
    application: {
      id: newApplication.id,
      applicationCode: newApplication.applicationCode,
      status: newApplication.status,
    },
  };
}

async function documentContent(id, userId) {
  const document = await prisma.bursaryDocument.findFirst({
    where: { id: parseInt(id, 10), userId },
  });
  if (!document) throw new ApiError(404, 'Document not found');
  return document;
}

async function myApplications(userId) {
  const rows = await prisma.bursaryApplication.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { applications: rows.map(toPublic) };
}

async function findOwned(id, userId) {
  const application = await prisma.bursaryApplication.findFirst({
    where: { id: parseInt(id, 10), userId },
  });
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  return application;
}

async function myApplication(id, userId) {
  const application = await findOwned(id, userId);
  return { application: toPublic(application) };
}

async function withdraw(id, userId) {
  await findOwned(id, userId);
  const updated = await prisma.bursaryApplication.update({
    where: { id: parseInt(id, 10) },
    data: { status: 'Withdrawn' },
  });
  return { message: 'Application withdrawn successfully', application: toPublic(updated) };
}

async function remove(id, userId) {
  const result = await prisma.bursaryApplication.deleteMany({
    where: { id: parseInt(id, 10), userId },
  });
  if (result.count === 0) {
    throw new ApiError(404, 'Application not found');
  }
  return { message: 'Application deleted successfully' };
}

async function history(id, userId) {
  await findOwned(id, userId);
  return { history: [] };
}

module.exports = {
  apply,
  uploadDocument,
  documentContent,
  myApplications,
  myApplication,
  withdraw,
  remove,
  history,
};
