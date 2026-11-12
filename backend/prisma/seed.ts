import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ADMIN_BCRYPT_ROUNDS,
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_PASSWORD,
  ADMIN_PHONE,
} from '../src/common/constants/admin-seed.constants';

const prisma = new PrismaClient();

/**
 * Green Corner seed data.
 *
 * Categories follow the PRD (§3.1) exactly:
 *   Indoor Plants, Outdoor Plants, Compost & Fertilizers (Joibo Sar),
 *   Gardening Equipment, Seed Packets, Pots & Planters (Tob).
 *
 * Admin login seeded here: admin@greencorner.bd / AdminPassword123!
 */

const categories = [
  {
    name: 'Indoor Plants',
    slug: 'indoor-plants',
    description:
      'Low-light tolerant houseplants for flats, offices and living rooms.',
    imageUrl: 'https://images.unsplash.com/photo-1614594575810-1e9b4b8b1c9b?w=800',
  },
  {
    name: 'Outdoor Plants',
    slug: 'outdoor-plants',
    description:
      'Rooftop and balcony plants that thrive in Dhaka’s subtropical climate.',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  },
  {
    name: 'Compost & Fertilizers',
    slug: 'compost-fertilizers',
    description:
      'Joibo Sar — organic compost and plant food made from local sources.',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
  },
  {
    name: 'Gardening Equipment',
    slug: 'gardening-equipment',
    description:
      'Watering cans, planting tools and harvesting shears for every job.',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  },
  {
    name: 'Seed Packets',
    slug: 'seed-packets',
    description: 'Flower and vegetable seeds suited to Bangladesh conditions.',
    imageUrl: 'https://images.unsplash.com/photo-1621956838481-f8f6166c8d47?w=800',
  },
  {
    name: 'Pots & Planters',
    slug: 'pots-planters',
    description: 'Tob — terracotta, ceramic and self-watering planters for every plant.',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
  },
];

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  careInstructions: string;
  price: number;
  stock: number;
  categorySlug: string;
  isFeatured?: boolean;
  imageUrl: string;
}

const products: SeedProduct[] = [
  {
    name: 'Money Plant (Pothos Golden)',
    slug: 'money-plant-pothos-golden',
    description:
      'A fast growing trailing vine with heart shaped golden variegated leaves. One of the easiest houseplants to keep alive and a natural air purifier.',
    careInstructions:
      'Keep in bright, indirect light. Water when the top 2cm of soil feels dry. Feed with diluted liquid fertiliser once a month in the growing season. Wipe the leaves monthly to keep them glossy.',
    price: 450,
    stock: 25,
    categorySlug: 'indoor-plants',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1614594575810-1e9b4b8b1c9b?w=800',
  },
  {
    name: 'Snake Plant (Sansevieria)',
    slug: 'snake-plant-sansevieria',
    description:
      'Tall upright leaves with striking yellow edges. Releases oxygen at night and survives almost any conditions, making it ideal for beginners and offices.',
    careInstructions:
      'Tolerates low light but grows fastest in indirect light. Let the soil dry out completely between waterings. Avoid overwatering — this is the most common cause of failure.',
    price: 780,
    stock: 18,
    categorySlug: 'indoor-plants',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae2e1f?w=800',
  },
  {
    name: 'Spider Plant',
    slug: 'spider-plant',
    description:
      'Graceful arching leaves that produce baby plantlets on long stems. Safe for cats and endlessly generous with new growth.',
    careInstructions:
      'Bright indirect light. Water weekly, allowing the top inch of soil to dry. Trim brown leaf tips and pot the plantlets to share with friends.',
    price: 520,
    stock: 30,
    categorySlug: 'indoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=800',
  },
  {
    name: 'Peace Lily (Spathiphyllum)',
    slug: 'peace-lily-spathiphyllum',
    description:
      'Glossy dark foliage with elegant white blooms. It visibly droops when thirsty, which makes watering straightforward even for new plant parents.',
    careInstructions:
      'Keep in medium to low indirect light. Water when the leaves just begin to droop. Use filtered or room temperature water to prevent brown leaf edges.',
    price: 950,
    stock: 12,
    categorySlug: 'indoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32e5cee?w=800',
  },
  {
    name: 'Aloe Vera',
    slug: 'aloe-vera',
    description:
      'Thick fleshy leaves packed with soothing gel. A low care succulent that also helps purify indoor air.',
    careInstructions:
      'Needs 6+ hours of bright light. Water deeply but only once the soil is completely dry. Keep in a pot with a drainage hole to prevent root rot.',
    price: 480,
    stock: 22,
    categorySlug: 'indoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f2360af8e4?w=800',
  },
  {
    name: 'Tulsi (Holy Basil) Plant',
    slug: 'tulsi-holy-basil-plant',
    description:
      'The sacred medicinal herb of Bangladesh, supplied as a healthy rooted plant ready for your kitchen window or terrace.',
    careInstructions:
      'Full sun to partial shade. Keep the soil evenly moist but never waterlogged. Harvest the top leaves regularly to encourage bushy growth.',
    price: 180,
    stock: 40,
    categorySlug: 'indoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800',
  },
  {
    name: 'Curry Leaf Tree',
    slug: 'curry-leaf-tree',
    description:
      'An aromatic small tree that supplies fresh curry leaves for your kitchen. Grown widely across Bangladesh.',
    careInstructions:
      'Needs plenty of sunlight — at least 6 hours a day. Water regularly during the growing season and mulch the base to retain moisture.',
    price: 650,
    stock: 14,
    categorySlug: 'outdoor-plants',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=800',
  },
  {
    name: 'Moringa Tree Sapling',
    slug: 'moringa-tree-sapling',
    description:
      'The drumstick tree — a fast growing multipurpose plant used for leaves, pods and seeds, ideal for rooftop gardens.',
    careInstructions:
      'Full sun and warm temperatures. Drought tolerant once established. Water young plants regularly for the first two months, then reduce.',
    price: 550,
    stock: 16,
    categorySlug: 'outdoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1599685315640-9ceab2f581ca?w=800',
  },
  {
    name: 'Hibiscus (Jaba) Plant',
    slug: 'hibiscus-jaba-plant',
    description:
      'A flowering shrub producing large showy blooms in shades of red, pink and yellow. A favourite of Bengali gardens.',
    careInstructions:
      'Needs full sun for abundant flowering. Water daily in summer and feed with phosphate rich fertiliser every two weeks while flowering.',
    price: 420,
    stock: 20,
    categorySlug: 'outdoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800',
  },
  {
    name: 'Lemon Tree Sapling',
    slug: 'lemon-tree-sapling',
    description:
      'A grafted lemon sapling that fruits in about 18 months. Glossy leaves and fragrant white blossom.',
    careInstructions:
      'Full sun, well drained soil. Water deeply twice a week in summer. Feed with citrus fertiliser three times a year and repot every two years.',
    price: 890,
    stock: 10,
    categorySlug: 'outdoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=800',
  },
  {
    name: 'Bougainvillea Plant',
    slug: 'bougainvillea-plant',
    description:
      'Vibrant magenta bracts on a woody climber. Perfect for training along fences, trellises and balcony railings.',
    careInstructions:
      'Abundant sun is essential for colour. Prune after each flowering flush to keep the shape compact. Reduce watering in winter.',
    price: 500,
    stock: 15,
    categorySlug: 'outdoor-plants',
    imageUrl: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800',
  },
  {
    name: 'Organic Compost (Joibo Sar) 5 kg',
    slug: 'organic-compost-joibo-sar-5kg',
    description:
      'Fully decomposed organic compost made from plant waste, cow dung and leaf mould. Improves soil structure and water retention.',
    careInstructions:
      'Mix one part compost with two parts garden soil before planting. Top dress pots with 2cm of compost every two months. Store in a dry, shaded place.',
    price: 350,
    stock: 60,
    categorySlug: 'compost-fertilizers',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
  },
  {
    name: 'Leafy Vegetable Compost 10 kg',
    slug: 'leafy-vegetable-compost-10kg',
    description:
      'A nutrient rich compost blend formulated for leafy greens and vegetable beds, with added bone meal for strong root growth.',
    careInstructions:
      'Apply a 3cm layer over the bed and mix into the topsoil before sowing. Water lightly after application to help the nutrients settle.',
    price: 600,
    stock: 45,
    categorySlug: 'compost-fertilizers',
    imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800',
  },
  {
    name: 'Organic Liquid Fertiliser 1 L',
    slug: 'organic-liquid-fertiliser-1l',
    description:
      'A concentrated seaweed and compost tea feed that restores tired soil and encourages vigorous leafy growth in potted plants.',
    careInstructions:
      'Dilute 10ml per litre of water. Feed every two weeks during the growing season. Alternate with compost tea for best results.',
    price: 420,
    stock: 38,
    categorySlug: 'compost-fertilizers',
    imageUrl: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800',
  },
  {
    name: 'Cocopeat Growing Medium 5 kg',
    slug: 'cocopeat-growing-medium-5kg',
    description:
      'Clean, weed free coco coir for seedling trays and pot mixes. Holds moisture while still letting the roots breathe.',
    careInstructions:
      'Soak in water for 30 minutes and squeeze until just moist before use. Mix 1 part cocopeat with 1 part perlite for the best drainage.',
    price: 300,
    stock: 50,
    categorySlug: 'compost-fertilizers',
    imageUrl: 'https://images.unsplash.com/photo-1610921916247-9d7dbe45b6d4?w=800',
  },
  {
    name: 'Garden Watering Can 2 L',
    slug: 'garden-watering-can-2l',
    description:
      'A balanced, easy-pour steel watering can with a removable rose sprinkler for gentle watering of seedlings.',
    careInstructions:
      'Rinse after each use to avoid mineral build up. The rose can be removed for a stronger stream when watering large pots.',
    price: 700,
    stock: 24,
    categorySlug: 'gardening-equipment',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800',
  },
  {
    name: 'Harvesting Shears',
    slug: 'harvesting-shears',
    description:
      'Sharp bypass secateurs with a comfortable grip, for pruning herbs, cutting stems and harvesting vegetables cleanly.',
    careInstructions:
      'Wipe the blades with alcohol after use to prevent disease transfer. Oil the pivot occasionally to keep the action smooth.',
    price: 480,
    stock: 26,
    categorySlug: 'gardening-equipment',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  },
  {
    name: 'Hand Trowel & Planting Tool Set',
    slug: 'hand-trowel-planting-tool-set',
    description:
      'A three piece stainless steel set — trowel, cultivator and dibber — with soft grip handles for potting and planting.',
    careInstructions:
      'Clean the tools after every use and dry them before storing to prevent rust. Lightly oil the metal in the off season.',
    price: 550,
    stock: 28,
    categorySlug: 'gardening-equipment',
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800',
  },
  {
    name: 'Garden Hose 20 m',
    slug: 'garden-hose-20m',
    description:
      'A flexible 20 metre hose with a brass fitting and adjustable spray nozzle, tough enough for daily rooftop watering.',
    careInstructions:
      'Drain the hose after use to prevent kinking and bacterial growth. Store it loosely coiled in the shade.',
    price: 1250,
    stock: 9,
    categorySlug: 'gardening-equipment',
    imageUrl: 'https://images.unsplash.com/photo-1621956838481-f8f6166c8d47?w=800',
  },
  {
    name: 'Marigold Flower Seeds',
    slug: 'marigold-flower-seeds',
    description:
      'A packet of 200 bright marigold seeds. Fast growing and generous, marigolds bloom within eight weeks and help deter pests.',
    careInstructions:
      'Sow in a sunny spot 1cm deep. Keep the seedbed moist until germination, then thin seedlings to 20cm apart. Deadhead regularly for continuous flowers.',
    price: 90,
    stock: 120,
    categorySlug: 'seed-packets',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800',
  },
  {
    name: 'Tomato Seeds (Hybrid)',
    slug: 'tomato-seeds-hybrid',
    description:
      'High yielding hybrid tomato seeds suited to the warm humid climate of Dhaka. Expect large, firm fruit on a compact plant.',
    careInstructions:
      'Start indoors in seed trays 6 weeks before transplanting. Provide full sun and a stake for support. Feed with potassium rich fertiliser once fruit sets.',
    price: 120,
    stock: 100,
    categorySlug: 'seed-packets',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800',
  },
  {
    name: 'Brinjal (Begun) Seeds',
    slug: 'brinjal-begun-seeds',
    description:
      'A prolific brinjal variety producing glossy purple fruit. A staple vegetable in every Bangladeshi kitchen garden.',
    careInstructions:
      'Sow in warm soil with full sun. Keep evenly moist, and add mulch to stop the fruit touching the soil. Harvest while the skin is still glossy.',
    price: 80,
    stock: 130,
    categorySlug: 'seed-packets',
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800',
  },
  {
    name: 'Chilli Seeds (Kachcha Morich)',
    slug: 'chilli-seeds-kachcha-morich',
    description:
      'The fierce green chilli of Bangladesh with a clean, sharp heat. A compact plant that fruits heavily.',
    careInstructions:
      'Needs warm temperatures and full sun. Water regularly but let the topsoil dry between waterings. Pick chillies regularly for more fruit.',
    price: 70,
    stock: 140,
    categorySlug: 'seed-packets',
    imageUrl: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=800',
  },
  {
    name: 'Spinach Palak Seeds',
    slug: 'spinach-palak-seeds',
    description:
      'Fast growing desi spinach with tender dark leaves. Grows happily in cooler months and is one of the fastest vegetables to harvest.',
    careInstructions:
      'Sow directly in the bed in rows 20cm apart. Keep the soil rich with compost. Harvest the outer leaves first to let the centre keep growing.',
    price: 60,
    stock: 150,
    categorySlug: 'seed-packets',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800',
  },
  {
    name: 'Terracotta Pot 8 inch (Tob)',
    slug: 'terracotta-pot-8-inch',
    description:
      'A classic unglazed terracotta planter with a drainage hole. Breathable clay keeps root zones cool and prevents waterlogging.',
    careInstructions:
      'Soak in water for an hour before potting to stop it leaching moisture from fresh soil. Scrub the inside between uses to avoid disease.',
    price: 380,
    stock: 55,
    categorySlug: 'pots-planters',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
  },
  {
    name: 'Ceramic Planter with Saucer 10 inch',
    slug: 'ceramic-planter-with-saucer-10-inch',
    description:
      'A glazed ceramic planter with a matching water catching saucer. A clean, modern look for indoor plants and small trees.',
    careInstructions:
      'The saucer must be emptied after watering so the roots do not sit in water. Wipe the glaze monthly to keep it bright.',
    price: 850,
    stock: 30,
    categorySlug: 'pots-planters',
    imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800',
  },
  {
    name: 'Self Watering Planter 12 inch',
    slug: 'self-watering-planter-12-inch',
    description:
      'A two tier planter with a built in water reservoir that keeps the root zone moist for days. Ideal for busy plant owners.',
    careInstructions:
      'Fill the lower reservoir through the fill port and check the level every week. Never let the water reach the upper soil tray.',
    price: 1250,
    stock: 18,
    categorySlug: 'pots-planters',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  },
  {
    name: 'Hanging Basket with Coir Liner',
    slug: 'hanging-basket-with-coir-liner',
    description:
      'A coir lined hanging basket for trailing plants and ferns. Comes with a strong chain that holds its shape when wet.',
    careInstructions:
      'Soak the coir liner before planting so it does not wick moisture away from the roots. Water daily in summer as hanging baskets dry out fast.',
    price: 650,
    stock: 26,
    categorySlug: 'pots-planters',
    imageUrl: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800',
  },
];

async function main() {
  console.log('Seeding Green Corner...');

  const password = await bcrypt.hash(ADMIN_PASSWORD, ADMIN_BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, role: Role.ADMIN, password },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password,
      phone: ADMIN_PHONE,
      role: Role.ADMIN,
    },
  });
  console.log(`Admin user ready: ${admin.email} / ${ADMIN_PASSWORD}`);

  const customerPassword = await bcrypt.hash(
    'Customer@123',
    ADMIN_BCRYPT_ROUNDS,
  );
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@example.com',
      password: customerPassword,
      phone: '01735262232',
      role: Role.USER,
    },
  });
  console.log(`Customer user ready: ${customer.email} / Customer@123`);

  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      },
      create: category,
    });
    categoryIds.set(category.slug, record.id);
    console.log(`Category: ${record.name}`);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category slug: ${product.categorySlug}`);
    }

    const { categorySlug, ...data } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...data, categoryId },
      create: { ...data, categoryId, images: [] },
    });
    console.log(`Product: ${product.name}`);
  }

  console.log('\nSeed complete.');
  console.log(`Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Customer: customer@example.com / Customer@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
