import {createSignal} from 'solid-js';
import Pagination from '../components/Pagination/Pagination';

export default function Example() {
  const [page, setPage] = createSignal<number>(1);
  return (
    <div
      style={{
        display: 'grid',
        'place-items': 'center',
        'align-content': 'center',
        height: '100%',
      }}
    >
      <h1 style={{color: 'white'}}>Selected Page: {page()}</h1>
      <Pagination pageNumber={page()} lastPage={50} onChange={setPage} />
    </div>
  );
}
