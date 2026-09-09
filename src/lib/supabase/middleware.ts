import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/connexion", "/inscription", "/offline.html"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // `getUser()` peut avoir renouvelé la session : les cookies rafraîchis sont
  // posés sur `response`. Une redirection crée une réponse neuve, il faut donc
  // les recopier — sinon le navigateur garde l'ancien refresh token, que
  // Supabase a déjà consommé (rotation), et la session saute au hasard.
  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user && !isPublic && pathname !== "/") {
    return redirectTo("/connexion");
  }

  if (user && (pathname === "/connexion" || pathname === "/inscription")) {
    return redirectTo("/accueil");
  }

  return response;
}
