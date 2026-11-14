# useMyInventory Hook

This hook provides a way to fetch user inventory items from the `/inventory` endpoint using React Query and Axios.

## Features

- **Authentication**: Automatically includes the HTTP-only session cookie in requests
- **Caching**: Uses React Query for efficient caching and state management
- **Error Handling**: Proper error handling with retry logic
- **Loading States**: Built-in loading and error states
- **Type Safety**: Full TypeScript support

## Usage

```tsx
import { useMyInventory } from "@/hooks/inventory/useMyInventory";

const MyComponent = () => {
  const { data, isLoading, error } = useMyInventory();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {data?.items.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <p>Type: {item.type}</p>
          <p>Level: {item.level}</p>
        </div>
      ))}
    </div>
  );
};
```

## API Response Structure

The hook expects the API to return data in this format:

```typescript
interface InventoryResponse {
  items: InventoryItem[];
}

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  rarity?: string;
  level?: number;
  image?: string;
  equipped?: boolean;
}
```

## Configuration

The hook automatically:

- Uses HTTP-only session cookies for authentication (via `withCredentials: true`)
- Only runs when the user is authenticated
- Caches data efficiently with React Query
- Handles loading, error, and empty states

## Dependencies

- `@tanstack/react-query`: For data fetching and caching
- `axios`: For HTTP requests
- `@/contexts/AuthContext`: For authentication state
