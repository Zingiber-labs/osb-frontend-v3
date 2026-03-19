# useStoreItems Hook

This hook provides a way to fetch store items from the `/items` endpoint using React Query and Axios.

## Features

- **Authentication**: Automatically includes the session token in requests
- **Caching**: Uses React Query for efficient caching and state management
- **Error Handling**: Proper error handling with retry logic
- **Loading States**: Built-in loading and error states
- **Type Safety**: Full TypeScript support

## Usage

```tsx
import { useStoreItems } from "@/hooks/store-page/useStoreItems";

const MyComponent = () => {
  const { data, isLoading, error } = useStoreItems();

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
          <p>${item.price}</p>
        </div>
      ))}
    </div>
  );
};
```

## API Response Structure

The hook expects the API to return data in this format:

```typescript
interface StoreItemsResponse {
  items: StoreItem[];
}

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  iconUrl?: string;
}
```

## Configuration

The hook automatically:

- Uses the session token from cookies for authentication
- Includes credentials in requests
- Retries failed requests (except 401 errors)
- Caches data for 5 minutes
- Only runs when the user is authenticated

## Dependencies

- `@tanstack/react-query`: For data fetching and caching
- `axios`: For HTTP requests
- `@/contexts/AuthContext`: For authentication state
- `@/lib/auth`: For session token management
