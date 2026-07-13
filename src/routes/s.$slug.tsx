import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicSite, siteContentSchema } from "@/lib/sites.functions";
import { SiteRenderer } from "@/components/SiteRenderer";

const siteQuery = (slug: string) =>
  queryOptions({
    queryKey: ["public-site", slug],
    queryFn: () => getPublicSite({ data: { slug } }),
  });

export const Route = createFileRoute("/s/$slug")({
  loader: async ({ params, context }) => {
    const site = await context.queryClient.ensureQueryData(siteQuery(params.slug));
    if (!site) throw notFound();
    return { site };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Site não encontrado" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const parsed = siteContentSchema.safeParse(loaderData.site.content);
    const desc = parsed.success ? parsed.data.subheadline : loaderData.site.title;
    return {
      meta: [
        { title: loaderData.site.title },
        { name: "description", content: desc },
        { property: "og:title", content: loaderData.site.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicSite,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold">Site não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Este endereço não existe ou o site foi despublicado.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm underline text-primary">
          Voltar para LumeLeads
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <p className="text-muted-foreground">Erro ao carregar o site.</p>
    </div>
  ),
});

function PublicSite() {
  const { slug } = Route.useParams();
  const { data: site } = useSuspenseQuery(siteQuery(slug));
  if (!site) return null;
  const parsed = siteContentSchema.safeParse(site.content);
  if (!parsed.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-muted-foreground">
        Este site ainda está sendo preparado.
      </div>
    );
  }
  const theme = (site.theme as { primary?: string; accent?: string; background?: string; text?: string; template?: "modern" | "classic" | "bold" | "minimal" }) ?? {};
  return (
    <SiteRenderer
      siteId={site.id}
      content={parsed.data}
      theme={{
        primary: theme.primary ?? "#7c3aed",
        accent: theme.accent ?? "#22d3ee",
        background: theme.background,
        text: theme.text,
        template: theme.template ?? "modern",
      }}
    />
  );
}
