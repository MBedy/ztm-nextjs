import { magicAdmin } from "../../lib/magic";
import jwt from "jsonwebtoken";
import { createNewUser, isNewUser } from "../../lib/db/hasura";
import { setTokenCookie } from "../../lib/cookies";

export default async function login(req, res) {
  if (req.method === "POST") {
    try {
      const auth = req.headers.authorization;
      const didToken = auth ? auth.substr(7) : "";
      console.log({ didToken });
      const metadata = await magicAdmin.users.getMetadataByToken(
        "WyIweGNkMTFlYTU3YWQyYTI0NWNkODE5NDhiNDA3NzM1ZmEyNjM2YWRkZDg2Mzc2MWNkZDc1ZjA0NzRkMjlkOTBmZTI0ZGViZmZiMGJkMzQ4ZTU4MmE4ZmNkNTgyNDk5NzM2ZDQ1NmU2MmI1YThlOTExZWQwM2Y2Y2YxYjUxZDllZDA4MWMiLCJ7XCJpYXRcIjoxNjczOTkwODYwLFwiZXh0XCI6MTY3Mzk5MTc2MCxcImlzc1wiOlwiZGlkOmV0aHI6MHgwMjMwOEIxMTk4NTc3RDNFNDgyZEE4NTFiOTlmNzUyNGRBNjhFZUY4XCIsXCJzdWJcIjpcIjhKbHhGcnIwQ0pMRnhiU1cwd1NBb0RBTU9od0pLWllSak1hRkxmU2pIa1k9XCIsXCJhdWRcIjpcInRxa0VNa1M2VlNhalgxRUtZaHZFeGwwbHJQeTdtbHJibHkyZFU0Z2x1c1k9XCIsXCJuYmZcIjoxNjczOTkwODYwLFwidGlkXCI6XCIxMWFjZTE4Ni04MWYwLTRmMzgtOWUwYS01MDBjOWRiNzdhM2JcIixcImFkZFwiOlwiMHgwMmQ5NGRlOTQyNmU4NzkyNTU4YTQyNWE2M2I4MzEzNWE0OTIzZTQ3NGFlMjc1ODc3OTk3MjQ2NWU1NDdmMjkxMjc4ZjMxODdlNmI5YmUyNDYwNmY1ZGIyZWUzMTZjNzFhZWZlOGU1YjIyZDA2ZTNkMmUwMTVmNGQ0ZjcyNGUxZjFiXCJ9Il0="
      );
      console.log({ metadata });

      const token = jwt.sign(
        {
          ...metadata,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000 + 7 * 24 * 60 * 60),
          "https://hasura.io/jwt/claims": {
            "x-hasura-allowed-roles": ["user", "admin"],
            "x-hasura-default-role": "user",
            "x-hasura-user-id": `${metadata.issuer}`,
          },
        },
        process.env.JWT_SECRET
      );

      const isNewUserQuery = await isNewUser(token, metadata.issuer);
      isNewUserQuery && (await createNewUser(token, metadata));
      setTokenCookie(token, res);
      res.send({ done: true });
    } catch (error) {
      console.error("Something went wrong logging in", error);
      res.status(500).send({ done: false });
    }
  } else {
    res.send({ done: false });
  }
}
