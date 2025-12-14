import Image from 'next/image';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Image
      src="/nouailogo.png"
      alt="Nou AI Logo"
      width={128}
      height={128}
      {...props}
    />
  );
}
