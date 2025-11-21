import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const industryTemplates = [
  {
    industry: 'SOFTWARE_DEVELOPMENT',
    displayName: 'Software Development',
    description:
      'Templates for software companies developing new applications, algorithms, and systems',
    projectTemplates: [
      {
        name: 'New Algorithm Development',
        description:
          'Development of new or improved algorithms for data processing, machine learning, or optimization',
        businessComponent: 'Proprietary algorithm for [specific function]',
        technologies: [
          'Python',
          'TensorFlow',
          'Machine Learning',
          'Data Science',
        ],
        permittedPurpose: {
          question1:
            'Developed new algorithm to improve processing speed and accuracy',
          question2:
            'Algorithm provides significant performance improvements over existing solutions',
        },
        eliminationUncertainty: {
          question1:
            'Uncertainty existed regarding optimal approach for [specific challenge]',
          question2:
            'Method for achieving desired performance levels was unknown',
        },
        processExperimentation: {
          question1:
            'Evaluated multiple algorithmic approaches including [list approaches]',
          question2:
            'Conducted systematic testing and benchmarking of each approach',
        },
        technologicalNature: {
          question1:
            'Relied on computer science principles including algorithms, data structures, and optimization theory',
          question2:
            'Applied mathematical and computational methods to solve technical challenges',
        },
      },
      {
        name: 'API Development',
        description:
          'Creation of new APIs or significant improvements to existing APIs',
        businessComponent: 'RESTful API for [specific functionality]',
        technologies: ['Node.js', 'Express', 'GraphQL', 'PostgreSQL'],
        permittedPurpose: {
          question1:
            'Developed new API to enable [specific capability]',
          question2:
            'API provides improved functionality, performance, or reliability',
        },
        eliminationUncertainty: {
          question1:
            'Technical approach for handling [specific challenge] was uncertain',
          question2:
            'Optimal architecture and design patterns were unknown',
        },
        processExperimentation: {
          question1:
            'Tested multiple API designs and architectures',
          question2:
            'Evaluated performance, scalability, and maintainability of each approach',
        },
        technologicalNature: {
          question1:
            'Based on software engineering and distributed systems principles',
          question2:
            'Applied computer science methodologies for system design',
        },
      },
      {
        name: 'Performance Optimization',
        description:
          'Significant improvements to application performance or scalability',
        businessComponent: 'High-performance [system component]',
        technologies: ['C++', 'Redis', 'Load Balancing', 'Caching'],
        permittedPurpose: {
          question1:
            'Improved system performance to meet business requirements',
          question2:
            'Achieved significant reduction in latency and resource usage',
        },
        eliminationUncertainty: {
          question1:
            'Bottlenecks and optimal optimization strategies were unknown',
          question2:
            'Approach to achieving target performance was uncertain',
        },
        processExperimentation: {
          question1:
            'Profiled system to identify bottlenecks and tested multiple optimization techniques',
          question2:
            'Systematically evaluated impact of each optimization',
        },
        technologicalNature: {
          question1:
            'Applied computer science principles of algorithms and system optimization',
          question2:
            'Used performance engineering and profiling methodologies',
        },
      },
    ],
    commonActivities: [
      'Algorithm development',
      'System architecture design',
      'Performance optimization',
      'Security enhancements',
      'Database optimization',
      'API development',
      'Cloud infrastructure',
      'DevOps automation',
    ],
    suggestedQuestions: {
      permittedPurpose: [
        'What new or improved functionality does this software provide?',
        'How does this improve upon existing solutions?',
        'What business problem does this solve?',
      ],
      eliminationUncertainty: [
        'What technical challenges did you face?',
        'What was uncertain about the approach or method?',
        'What alternatives did you consider?',
      ],
      processExperimentation: [
        'What prototypes or proof-of-concepts did you build?',
        'How did you test and evaluate different approaches?',
        'What metrics did you use to measure success?',
      ],
      technologicalNature: [
        'What computer science principles did you apply?',
        'What programming languages and frameworks did you use?',
        'How did you apply software engineering best practices?',
      ],
    },
    isActive: true,
  },
  {
    industry: 'MANUFACTURING',
    displayName: 'Manufacturing',
    description:
      'Templates for manufacturing companies improving processes, products, or equipment',
    projectTemplates: [
      {
        name: 'Process Automation',
        description:
          'Development of automated manufacturing processes or robotic systems',
        businessComponent: 'Automated production line for [product]',
        technologies: ['PLC Programming', 'Robotics', 'SCADA', 'Industrial IoT'],
        permittedPurpose: {
          question1:
            'Developed automated process to improve production efficiency',
          question2:
            'Automation provides faster, more consistent, and higher quality production',
        },
        eliminationUncertainty: {
          question1:
            'Optimal automation approach and equipment configuration were uncertain',
          question2:
            'Integration challenges with existing equipment were unknown',
        },
        processExperimentation: {
          question1:
            'Tested multiple automation configurations and control strategies',
          question2:
            'Conducted trials to optimize speed, quality, and reliability',
        },
        technologicalNature: {
          question1:
            'Applied mechanical engineering, robotics, and control systems principles',
          question2:
            'Used engineering methodologies for system design and optimization',
        },
      },
      {
        name: 'Product Design Improvement',
        description:
          'Significant improvements to product design for performance or manufacturability',
        businessComponent: 'Improved [product name] design',
        technologies: ['CAD', 'FEA', 'CFD', 'Prototyping'],
        permittedPurpose: {
          question1:
            'Redesigned product to improve [specific characteristics]',
          question2:
            'New design provides better performance, durability, or cost-effectiveness',
        },
        eliminationUncertainty: {
          question1:
            'Optimal design configuration to meet requirements was uncertain',
          question2:
            'Material selection and manufacturing approach were unknown',
        },
        processExperimentation: {
          question1:
            'Created and tested multiple design iterations',
          question2:
            'Conducted simulations and physical testing to validate designs',
        },
        technologicalNature: {
          question1:
            'Applied mechanical engineering and materials science principles',
          question2:
            'Used CAD, simulation, and prototyping technologies',
        },
      },
    ],
    commonActivities: [
      'Process automation',
      'Product design',
      'Quality control systems',
      'Equipment modifications',
      'Material testing',
      'Production optimization',
      'Tool and die development',
      'Process monitoring',
    ],
    suggestedQuestions: {
      permittedPurpose: [
        'What manufacturing process or product did you improve?',
        'How does this improve efficiency, quality, or cost?',
        'What capabilities did this enable?',
      ],
      eliminationUncertainty: [
        'What engineering challenges did you face?',
        'What was uncertain about the design or process?',
        'What variables affected the outcome?',
      ],
      processExperimentation: [
        'What prototypes or trials did you conduct?',
        'How did you test different approaches?',
        'What measurements did you take?',
      ],
      technologicalNature: [
        'What engineering principles did you apply?',
        'What technologies and tools did you use?',
        'How did you validate your approach?',
      ],
    },
    isActive: true,
  },
  {
    industry: 'BIOTECHNOLOGY',
    displayName: 'Biotechnology',
    description:
      'Templates for biotech companies developing drugs, diagnostics, or laboratory processes',
    projectTemplates: [
      {
        name: 'Drug Formulation Development',
        description:
          'Development of new drug formulations or delivery methods',
        businessComponent: 'Novel drug formulation for [therapeutic area]',
        technologies: [
          'Formulation Science',
          'Analytical Chemistry',
          'Stability Testing',
          'In Vitro Testing',
        ],
        permittedPurpose: {
          question1:
            'Developed new formulation to improve drug delivery and efficacy',
          question2:
            'Formulation provides better bioavailability, stability, or patient compliance',
        },
        eliminationUncertainty: {
          question1:
            'Optimal excipients and formulation approach were uncertain',
          question2:
            'Stability and bioavailability characteristics were unknown',
        },
        processExperimentation: {
          question1:
            'Tested multiple formulation variants with different excipients',
          question2:
            'Conducted analytical testing and stability studies on each formulation',
        },
        technologicalNature: {
          question1:
            'Applied pharmaceutical sciences, chemistry, and biology principles',
          question2:
            'Used analytical techniques and formulation methodologies',
        },
      },
    ],
    commonActivities: [
      'Drug formulation',
      'Assay development',
      'Cell line development',
      'Protein purification',
      'Analytical method development',
      'Process scale-up',
      'Stability testing',
      'Clinical trial design',
    ],
    suggestedQuestions: {
      permittedPurpose: [
        'What new drug, diagnostic, or process did you develop?',
        'How does this improve upon existing approaches?',
        'What therapeutic or diagnostic benefit does this provide?',
      ],
      eliminationUncertainty: [
        'What scientific challenges did you face?',
        'What was uncertain about the approach?',
        'What biological or chemical variables affected outcomes?',
      ],
      processExperimentation: [
        'What experiments did you conduct?',
        'How did you test different formulations or methods?',
        'What assays or analytical methods did you use?',
      ],
      technologicalNature: [
        'What biological or chemical principles did you apply?',
        'What laboratory techniques and equipment did you use?',
        'How did you validate your results?',
      ],
    },
    isActive: true,
  },
  {
    industry: 'ARCHITECTURE_ENGINEERING',
    displayName: 'Architecture & Engineering',
    description:
      'Templates for A&E firms developing innovative structural, mechanical, or building systems',
    projectTemplates: [
      {
        name: 'Structural Innovation',
        description:
          'Development of new structural systems or significant improvements',
        businessComponent: 'Innovative structural system for [building type]',
        technologies: ['FEA', 'BIM', 'Structural Analysis', 'CAD'],
        permittedPurpose: {
          question1:
            'Developed new structural approach for [specific application]',
          question2:
            'Design provides improved performance, efficiency, or cost-effectiveness',
        },
        eliminationUncertainty: {
          question1:
            'Optimal structural configuration to meet requirements was uncertain',
          question2:
            'Load distribution and material behavior were unknown',
        },
        processExperimentation: {
          question1:
            'Analyzed multiple structural configurations using FEA',
          question2:
            'Tested scale models and conducted simulations',
        },
        technologicalNature: {
          question1:
            'Applied structural engineering and mechanics principles',
          question2:
            'Used engineering analysis and simulation tools',
        },
      },
    ],
    commonActivities: [
      'Structural design',
      'Energy modeling',
      'Building systems integration',
      'Sustainability analysis',
      'Seismic design',
      'HVAC optimization',
      'Lighting design',
      'BIM development',
    ],
    suggestedQuestions: {
      permittedPurpose: [
        'What new or improved system did you design?',
        'How does this improve building performance?',
        'What technical challenge did this address?',
      ],
      eliminationUncertainty: [
        'What design challenges did you face?',
        'What was uncertain about structural or system performance?',
        'What variables affected the design?',
      ],
      processExperimentation: [
        'What design alternatives did you evaluate?',
        'What analysis or simulations did you perform?',
        'How did you validate your design?',
      ],
      technologicalNature: [
        'What engineering principles did you apply?',
        'What analysis tools and software did you use?',
        'How did you ensure code compliance?',
      ],
    },
    isActive: true,
  },
  {
    industry: 'FOOD_BEVERAGE',
    displayName: 'Food & Beverage',
    description:
      'Templates for food companies developing new products, processes, or packaging',
    projectTemplates: [
      {
        name: 'Recipe Development',
        description:
          'Development of new food or beverage formulations',
        businessComponent: 'New [product type] formulation',
        technologies: [
          'Food Science',
          'Sensory Testing',
          'Shelf-Life Testing',
          'Nutritional Analysis',
        ],
        permittedPurpose: {
          question1:
            'Developed new product formulation with improved characteristics',
          question2:
            'Formulation provides better taste, texture, nutrition, or shelf life',
        },
        eliminationUncertainty: {
          question1:
            'Optimal ingredient ratios and processing conditions were uncertain',
          question2:
            'Stability and sensory characteristics were unknown',
        },
        processExperimentation: {
          question1:
            'Tested multiple formulation variants with different ingredients',
          question2:
            'Conducted sensory panels and shelf-life studies',
        },
        technologicalNature: {
          question1:
            'Applied food science, chemistry, and microbiology principles',
          question2:
            'Used food processing and analytical methodologies',
        },
      },
    ],
    commonActivities: [
      'Recipe formulation',
      'Process optimization',
      'Packaging development',
      'Shelf-life extension',
      'Texture modification',
      'Flavor enhancement',
      'Nutritional improvement',
      'Quality control',
    ],
    suggestedQuestions: {
      permittedPurpose: [
        'What new product or process did you develop?',
        'How does this improve taste, nutrition, or shelf life?',
        'What consumer need does this address?',
      ],
      eliminationUncertainty: [
        'What formulation challenges did you face?',
        'What was uncertain about ingredient interactions?',
        'What processing variables affected the outcome?',
      ],
      processExperimentation: [
        'What formulations did you test?',
        'How did you evaluate sensory characteristics?',
        'What analytical tests did you perform?',
      ],
      technologicalNature: [
        'What food science principles did you apply?',
        'What testing and analysis methods did you use?',
        'How did you ensure food safety?',
      ],
    },
    isActive: true,
  },
];

async function seedIndustryTemplates() {
  console.log('Seeding industry templates...');

  for (const template of industryTemplates) {
    await prisma.industryTemplate.upsert({
      where: { industry: template.industry },
      update: template,
      create: template,
    });
    console.log(`✓ ${template.displayName}`);
  }

  console.log('Industry templates seeded successfully!');
}

seedIndustryTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
