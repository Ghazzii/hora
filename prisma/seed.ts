import {
  AnalyticsEventType,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  ReviewStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

const imageFor = (index: number) => `/images/watch-${index}.svg`;
const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const catalog = [
  {
    sku: "HORA-ATLAS",
    category: "classiques",
    nameFr: "Atlas Héritage",
    nameEn: "Atlas Heritage",
    descriptionFr:
      "Une montre habillée inspirée des lignes architecturales de Tunis, avec un cadran ivoire équilibré.",
    descriptionEn:
      "A dress watch inspired by Tunisian architecture, with a balanced ivory dial.",
    brand: "Hora",
    gender: "Unisexe",
    movement: "Automatique",
    caseMaterial: "Acier inoxydable 316L",
    strapMaterial: "Cuir",
    style: "Classique",
    color: "Ivoire",
    waterResistance: "5 ATM",
    price: 329000,
    compareAt: 359000,
    stock: 12,
    featured: true,
  },
  {
    sku: "HORA-CARTHAGE",
    category: "prestige",
    nameFr: "Carthage Noire",
    nameEn: "Carthage Noir",
    descriptionFr:
      "Boîtier noir brossé, détails dorés et mouvement automatique visible pour une présence affirmée.",
    descriptionEn:
      "Brushed black case, gold accents and an exhibition automatic movement with confident presence.",
    brand: "Hora",
    gender: "Homme",
    movement: "Automatique",
    caseMaterial: "Acier PVD noir",
    strapMaterial: "Acier",
    style: "Prestige",
    color: "Noir",
    waterResistance: "10 ATM",
    price: 489000,
    compareAt: null,
    stock: 7,
    featured: true,
  },
  {
    sku: "HORA-SIDI",
    category: "classiques",
    nameFr: "Sidi Bou",
    nameEn: "Sidi Bou",
    descriptionFr:
      "Un cadran bleu profond et une silhouette fine qui évoquent les portes de Sidi Bou Saïd.",
    descriptionEn:
      "A deep blue dial and slim silhouette inspired by the doors of Sidi Bou Said.",
    brand: "Hora",
    gender: "Unisexe",
    movement: "Quartz",
    caseMaterial: "Acier inoxydable",
    strapMaterial: "Cuir",
    style: "Élégant",
    color: "Bleu",
    waterResistance: "5 ATM",
    price: 219000,
    compareAt: 249000,
    stock: 18,
    featured: true,
  },
  {
    sku: "HORA-SAHARA",
    category: "sport",
    nameFr: "Sahara GMT",
    nameEn: "Sahara GMT",
    descriptionFr:
      "Une GMT robuste avec lunette 24 heures, conçue pour les voyages et les journées actives.",
    descriptionEn:
      "A robust GMT with a 24-hour bezel, made for travel and active days.",
    brand: "Hora",
    gender: "Homme",
    movement: "Quartz GMT",
    caseMaterial: "Acier inoxydable",
    strapMaterial: "Silicone",
    style: "Sport",
    color: "Sable",
    waterResistance: "20 ATM",
    price: 379000,
    compareAt: null,
    stock: 5,
    featured: true,
  },
  {
    sku: "HORA-JASMINE",
    category: "prestige",
    nameFr: "Jasmin Perle",
    nameEn: "Jasmine Pearl",
    descriptionFr:
      "Un cadran nacré, une lunette délicate et un bracelet fin pour une élégance lumineuse.",
    descriptionEn:
      "A mother-of-pearl dial, delicate bezel and slim bracelet for luminous elegance.",
    brand: "Hora",
    gender: "Femme",
    movement: "Quartz suisse",
    caseMaterial: "Acier doré",
    strapMaterial: "Acier",
    style: "Prestige",
    color: "Nacre",
    waterResistance: "5 ATM",
    price: 349000,
    compareAt: null,
    stock: 9,
    featured: true,
  },
  {
    sku: "HORA-CAPBON",
    category: "sport",
    nameFr: "Cap Bon Diver",
    nameEn: "Cap Bon Diver",
    descriptionFr:
      "Une plongeuse lisible et solide, avec couronne vissée et bracelet résistant à l'eau.",
    descriptionEn:
      "A legible, durable dive watch with screw-down crown and water-ready strap.",
    brand: "Hora",
    gender: "Unisexe",
    movement: "Automatique",
    caseMaterial: "Acier inoxydable",
    strapMaterial: "Caoutchouc",
    style: "Plongée",
    color: "Vert",
    waterResistance: "20 ATM",
    price: 459000,
    compareAt: 499000,
    stock: 4,
    featured: false,
  },
  {
    sku: "HORA-MEDINA",
    category: "classiques",
    nameFr: "Médina Petite",
    nameEn: "Medina Petite",
    descriptionFr:
      "Format compact, index dorés et bracelet maille pour accompagner le quotidien.",
    descriptionEn:
      "Compact proportions, gold indices and a mesh bracelet for everyday wear.",
    brand: "Hora",
    gender: "Femme",
    movement: "Quartz",
    caseMaterial: "Acier inoxydable",
    strapMaterial: "Maille milanaise",
    style: "Minimaliste",
    color: "Rose",
    waterResistance: "3 ATM",
    price: 189000,
    compareAt: null,
    stock: 21,
    featured: false,
  },
  {
    sku: "HORA-DOUGGA",
    category: "prestige",
    nameFr: "Dougga Squelette",
    nameEn: "Dougga Skeleton",
    descriptionFr:
      "Une pièce mécanique ajourée qui révèle son mouvement et célèbre le travail de précision.",
    descriptionEn:
      "An open-worked mechanical piece revealing its movement and celebrating precision craft.",
    brand: "Hora",
    gender: "Homme",
    movement: "Mécanique",
    caseMaterial: "Acier inoxydable",
    strapMaterial: "Cuir",
    style: "Prestige",
    color: "Anthracite",
    waterResistance: "5 ATM",
    price: 579000,
    compareAt: null,
    stock: 3,
    featured: true,
  },
] as const;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@hora.tn";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "HoraAdmin123!";
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? "client@hora.tn";
  const customerPassword =
    process.env.SEED_CUSTOMER_PASSWORD ?? "HoraClient123!";

  const [adminHash, customerHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(customerPassword, 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      active: true,
      mustChangePassword: true,
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "Hora",
      phone: "+21620000000",
      role: UserRole.ADMIN,
      active: true,
      mustChangePassword: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: customerHash, active: true },
    create: {
      email: customerEmail,
      passwordHash: customerHash,
      firstName: "Amira",
      lastName: "Ben Salem",
      phone: "+21622111222",
      role: UserRole.CUSTOMER,
      active: true,
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-address-amira" },
    update: {},
    create: {
      id: "seed-address-amira",
      userId: customer.id,
      label: "Maison",
      governorate: "Tunis",
      city: "La Marsa",
      postalCode: "2070",
      addressLine1: "12 avenue Habib Bourguiba",
      isDefault: true,
    },
  });

  const categories = await Promise.all(
    [
      {
        slugFr: "classiques",
        slugEn: "classics",
        nameFr: "Classiques",
        nameEn: "Classics",
        sortOrder: 1,
      },
      {
        slugFr: "sport",
        slugEn: "sport",
        nameFr: "Sport",
        nameEn: "Sport",
        sortOrder: 2,
      },
      {
        slugFr: "prestige",
        slugEn: "prestige",
        nameFr: "Prestige",
        nameEn: "Prestige",
        sortOrder: 3,
      },
    ].map((category) =>
      prisma.category.upsert({
        where: { slugFr: category.slugFr },
        update: category,
        create: category,
      }),
    ),
  );
  const categoryBySlug = new Map(categories.map((item) => [item.slugFr, item]));

  const products = [];
  for (const [index, item] of catalog.entries()) {
    const slugBase = item.sku.replace("HORA-", "").toLowerCase();
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        categoryId: categoryBySlug.get(item.category)!.id,
        nameFr: item.nameFr,
        nameEn: item.nameEn,
        descriptionFr: item.descriptionFr,
        descriptionEn: item.descriptionEn,
        featured: item.featured,
        averageRating: index % 3 === 0 ? 4.8 : 4.6,
        active: true,
      },
      create: {
        categoryId: categoryBySlug.get(item.category)!.id,
        sku: item.sku,
        slugFr: slugBase,
        slugEn: slugBase,
        nameFr: item.nameFr,
        nameEn: item.nameEn,
        descriptionFr: item.descriptionFr,
        descriptionEn: item.descriptionEn,
        brand: item.brand,
        gender: item.gender,
        movement: item.movement,
        caseMaterial: item.caseMaterial,
        strapMaterial: item.strapMaterial,
        style: item.style,
        color: item.color,
        waterResistance: item.waterResistance,
        seoTitleFr: `${item.nameFr} | Montres Hora Tunisie`,
        seoTitleEn: `${item.nameEn} | Hora Watches Tunisia`,
        seoDescriptionFr: item.descriptionFr,
        seoDescriptionEn: item.descriptionEn,
        featured: item.featured,
        averageRating: index % 3 === 0 ? 4.8 : 4.6,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [
        {
          productId: product.id,
          url: imageFor(index + 1),
          altFr: `${item.nameFr}, vue de face`,
          altEn: `${item.nameEn}, front view`,
          sortOrder: 0,
        },
        {
          productId: product.id,
          url: imageFor(index + 1),
          altFr: `${item.nameFr}, détail`,
          altEn: `${item.nameEn}, detail`,
          sortOrder: 1,
        },
      ],
    });

    await Promise.all([
      prisma.productVariant.upsert({
        where: { sku: `${item.sku}-STD` },
        update: {
          priceMillimes: item.price,
          compareAtPriceMillimes: item.compareAt,
          stock: item.stock,
          active: true,
        },
        create: {
          productId: product.id,
          sku: `${item.sku}-STD`,
          labelFr: "Bracelet standard",
          labelEn: "Standard strap",
          attributes: { size: "40 mm", finish: item.color },
          priceMillimes: item.price,
          compareAtPriceMillimes: item.compareAt,
          stock: item.stock,
          lowStockThreshold: 4,
        },
      }),
      prisma.productVariant.upsert({
        where: { sku: `${item.sku}-ALT` },
        update: {
          priceMillimes: item.price + 20000,
          stock: Math.max(2, item.stock - 2),
          active: true,
        },
        create: {
          productId: product.id,
          sku: `${item.sku}-ALT`,
          labelFr: "Bracelet premium",
          labelEn: "Premium strap",
          attributes: { size: "40 mm", finish: "Premium" },
          priceMillimes: item.price + 20000,
          stock: Math.max(2, item.stock - 2),
          lowStockThreshold: 3,
        },
      }),
    ]);
    products.push(product);
  }

  await Promise.all([
    prisma.review.upsert({
      where: {
        userId_productId: { userId: customer.id, productId: products[0]!.id },
      },
      update: { status: ReviewStatus.APPROVED },
      create: {
        userId: customer.id,
        productId: products[0]!.id,
        rating: 5,
        title: "Très élégante",
        body: "Belle finition et livraison rapide. Le paiement à la livraison est rassurant.",
        verified: true,
        status: ReviewStatus.APPROVED,
      },
    }),
    prisma.review.upsert({
      where: {
        userId_productId: { userId: customer.id, productId: products[3]!.id },
      },
      update: {},
      create: {
        userId: customer.id,
        productId: products[3]!.id,
        rating: 4,
        title: "Solide",
        body: "La montre est confortable et très lisible.",
        verified: false,
        status: ReviewStatus.PENDING,
      },
    }),
  ]);

  const seededOrders = [
    {
      number: "HORA-DEMO-1001",
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      source: "facebook",
      campaign: "launch-tunis",
      productIndex: 0,
      daysAgo: 12,
    },
    {
      number: "HORA-DEMO-1002",
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.UNPAID,
      source: "instagram",
      campaign: "summer-style",
      productIndex: 4,
      daysAgo: 5,
    },
    {
      number: "HORA-DEMO-1003",
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.UNPAID,
      source: "google",
      campaign: "brand-search",
      productIndex: 2,
      daysAgo: 2,
    },
    {
      number: "HORA-DEMO-1004",
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      source: "direct",
      campaign: null,
      productIndex: 7,
      daysAgo: 0,
    },
  ];

  for (const seeded of seededOrders) {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: seeded.number },
    });
    if (existing) continue;
    const product = products[seeded.productIndex]!;
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { productId: product.id },
      orderBy: { priceMillimes: "asc" },
    });
    const createdAt = new Date(
      Date.now() - seeded.daysAgo * 24 * 60 * 60 * 1000,
    );
    const order = await prisma.order.create({
      data: {
        orderNumber: seeded.number,
        accessTokenHash: tokenHash(`access-${seeded.number}`),
        idempotencyKey: `seed-${seeded.number}`,
        userId: customer.id,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        phone: customer.phone!,
        governorate: "Tunis",
        city: "La Marsa",
        postalCode: "2070",
        addressLine1: "12 avenue Habib Bourguiba",
        subtotalMillimes: variant.priceMillimes,
        deliveryFeeMillimes: 8000,
        totalMillimes: variant.priceMillimes + 8000,
        status: seeded.status,
        paymentStatus: seeded.paymentStatus,
        source: seeded.source,
        medium: "paid_social",
        campaign: seeded.campaign,
        utmSource: seeded.source,
        utmCampaign: seeded.campaign,
        landingPage: "/fr",
        createdAt,
        items: {
          create: {
            productId: product.id,
            productVariantId: variant.id,
            productNameFr: product.nameFr,
            productNameEn: product.nameEn,
            productSlugFr: product.slugFr,
            productSlugEn: product.slugEn,
            sku: variant.sku,
            variantLabelFr: variant.labelFr,
            variantLabelEn: variant.labelEn,
            quantity: 1,
            unitPriceMillimes: variant.priceMillimes,
            lineTotalMillimes: variant.priceMillimes,
            imageUrl: imageFor(seeded.productIndex + 1),
          },
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: seeded.status,
            actorUserId: admin.id,
            note: "Commande de démonstration",
            createdAt,
          },
        },
      },
    });
    await prisma.analyticsEvent.upsert({
      where: { eventId: `seed-order-${order.id}` },
      update: {},
      create: {
        eventId: `seed-order-${order.id}`,
        eventType: AnalyticsEventType.ORDER_PLACED,
        userId: customer.id,
        orderId: order.id,
        metadata: { source: seeded.source },
        createdAt,
      },
    });
  }

  console.log(
    `Hora seeded: ${products.length} products, admin ${adminEmail}, customer ${customerEmail}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
