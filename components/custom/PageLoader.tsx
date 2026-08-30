import Image from "next/image";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sand">
      <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary">
        <Image
          src="/images/logo.jpg"
          alt="Artle Bakeshop"
          width={32}
          height={32}
          className="h-full w-full rounded-full object-cover"
        />{" "}
      </span>
    </div>
  );
}
