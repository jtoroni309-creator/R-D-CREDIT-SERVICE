import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed state configurations
  const states = [
    {
      stateCode: 'CA',
      stateName: 'California',
      creditRate: 0.15,
      baseCalculation: 'METHOD_ASC',
      hasCarryforward: true,
      carryforwardYears: 0, // Unlimited
      hasCap: false,
      isRefundable: false,
      isActive: true,
      notes: 'California offers a 15% credit with unlimited carryforward',
    },
    {
      stateCode: 'NY',
      stateName: 'New York',
      creditRate: 0.10,
      baseCalculation: 'METHOD_REGULAR',
      hasCarryforward: true,
      carryforwardYears: 15,
      hasCap: false,
      isRefundable: false,
      isActive: true,
      notes: 'New York offers a 10% credit with 15-year carryforward',
    },
    {
      stateCode: 'TX',
      stateName: 'Texas',
      creditRate: 0.05,
      baseCalculation: 'METHOD_ASC',
      hasCarryforward: true,
      carryforwardYears: 20,
      hasCap: false,
      isRefundable: false,
      isActive: true,
      notes: 'Texas offers a 5% credit with 20-year carryforward',
    },
    {
      stateCode: 'MA',
      stateName: 'Massachusetts',
      creditRate: 0.10,
      baseCalculation: 'METHOD_ASC',
      hasCarryforward: true,
      carryforwardYears: 15,
      hasCap: false,
      isRefundable: false,
      isActive: true,
      notes: 'Massachusetts offers a 10% credit with 15-year carryforward',
    },
    {
      stateCode: 'WA',
      stateName: 'Washington',
      creditRate: 0.015,
      baseCalculation: 'METHOD_ASC',
      hasCarryforward: false,
      hasCap: true,
      capAmount: 2000000,
      isRefundable: false,
      isActive: true,
      notes: 'Washington offers a 1.5% credit with $2M annual cap',
    },
  ];

  for (const state of states) {
    await prisma.stateConfig.upsert({
      where: { stateCode: state.stateCode },
      update: state,
      create: state,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
