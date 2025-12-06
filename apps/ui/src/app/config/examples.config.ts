export interface ExamplePrompt {
  category: string;
  icon: string;
  prompts: string[];
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    category: 'Getting Started',
    icon: 'rocket_launch',
    prompts: [
      'How do I create my first Angular component with inputs and outputs?',
      'What is the difference between a component, directive, and pipe in Angular?',
      'How do I pass data from a parent component to a child component?',
      'Explain Angular project structure - what are the main folders and files?',
    ],
  },
  {
    category: 'Components & Templates',
    icon: 'web',
    prompts: [
      'How do I display a list of items using @for in Angular templates?',
      'Show me how to conditionally display content using @if and @else',
      'How do I handle form input and two-way binding with [(ngModel)]?',
      'What is the difference between property binding [property] and event binding (event)?',
    ],
  },
  {
    category: 'Services & HTTP',
    icon: 'cloud',
    prompts: [
      'How do I create a service to fetch data from an API using HttpClient?',
      'Show me how to handle loading states and errors when making HTTP requests',
      'How do I share data between multiple components using a service?',
      'What is dependency injection and how do I inject a service into a component?',
    ],
  },
  {
    category: 'Routing & Navigation',
    icon: 'map',
    prompts: [
      'How do I set up basic routing in my Angular application?',
      'Show me how to navigate between pages and pass parameters in the URL',
      'How do I create a navigation menu that highlights the active route?',
      'What is lazy loading and how do I implement it for better performance?',
    ],
  },
  {
    category: 'Forms & Validation',
    icon: 'edit_note',
    prompts: [
      'How do I create a reactive form with validation in Angular?',
      'Show me how to validate email, required fields, and custom validators',
      'How do I display validation error messages below form fields?',
      'What is the difference between template-driven forms and reactive forms?',
    ],
  },
  {
    category: 'Modern Angular (Signals)',
    icon: 'bolt',
    prompts: [
      'What are Angular Signals and why should I use them instead of observables?',
      'How do I create a counter component using signals for state management?',
      'Show me how to use computed() to derive values from signals',
      'How do I update a signal value and make the UI react to changes?',
    ],
  },
  {
    category: 'Angular Material',
    icon: 'palette',
    prompts: [
      'How do I add Angular Material to my project and use the button component?',
      'Show me how to create a form using Material input fields and validation',
      'How do I display a confirmation dialog using MatDialog?',
      'How do I create a responsive navigation layout with Material sidenav and toolbar?',
    ],
  },
  {
    category: 'Common Errors',
    icon: 'bug_report',
    prompts: [
      "Why am I getting \"Can't bind to 'ngModel' since it isn't a known property\"?",
      'How do I fix "NullInjectorError: No provider for HttpClient"?',
      'Why is my data not displaying even though the HTTP request succeeded?',
      'How do I fix "ExpressionChangedAfterItHasBeenCheckedError" in development?',
    ],
  },
];
