import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash,
      avatarColor: '#f472b6',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash,
      avatarColor: '#c084fc',
    },
  });

  // Create demo boards
  const board1 = await prisma.board.upsert({
    where: { id: 'demo-board-1' },
    update: {},
    create: {
      id: 'demo-board-1',
      title: 'Project Brainstorm',
      description: 'Initial brainstorming session for the new project',
      isPublic: false,
      ownerId: alice.id,
    },
  });

  const board2 = await prisma.board.upsert({
    where: { id: 'demo-board-2' },
    update: {},
    create: {
      id: 'demo-board-2',
      title: 'User Flow Diagram',
      description: 'Mapping out the user journey',
      isPublic: true,
      ownerId: alice.id,
    },
  });

  // Add Bob as a member of board1
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board1.id, userId: bob.id } },
    update: {},
    create: {
      boardId: board1.id,
      userId: bob.id,
      permission: 'edit',
    },
  });

  // Add some demo shapes to board1
  await prisma.shape.upsert({
    where: { boardId_elementId: { boardId: board1.id, elementId: 'shape-1' } },
    update: {},
    create: {
      boardId: board1.id,
      elementId: 'shape-1',
      type: 'rectangle',
      userId: alice.id,
      data: { x: 100, y: 100, width: 200, height: 120, stroke: '#f472b6', fill: '#ffe4ec', strokeWidth: 3 },
    },
  });

  await prisma.shape.upsert({
    where: { boardId_elementId: { boardId: board1.id, elementId: 'shape-2' } },
    update: {},
    create: {
      boardId: board1.id,
      elementId: 'shape-2',
      type: 'ellipse',
      userId: alice.id,
      data: { x: 400, y: 150, width: 150, height: 100, stroke: '#c084fc', fill: '#f3e8ff', strokeWidth: 3 },
    },
  });

  await prisma.shape.upsert({
    where: { boardId_elementId: { boardId: board1.id, elementId: 'shape-3' } },
    update: {},
    create: {
      boardId: board1.id,
      elementId: 'shape-3',
      type: 'text',
      userId: alice.id,
      data: { x: 150, y: 140, text: 'Main Idea', fontSize: 18, fill: '#9d174d' },
    },
  });

  console.log('Seed completed:');
  console.log(`  Users: alice@example.com, bob@example.com (password: password123)`);
  console.log(`  Boards: ${board1.title}, ${board2.title}`);
  console.log(`  Shapes: 3 demo shapes in ${board1.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
