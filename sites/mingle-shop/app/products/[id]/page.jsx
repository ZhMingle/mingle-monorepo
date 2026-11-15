import Shop from '../../shop';

export default async function ProductPage({params}) {
  const {id} = await params;
  return <Shop productId={id}/>;
}
