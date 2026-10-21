import java.io.InputStream;
import java.nio.file.Path;
import java.security.CodeSigner;
import java.security.MessageDigest;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPublicKey;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Locale;
import java.util.jar.JarFile;

/** Verifies an upload signature; never loads or executes application code. */
class VerifyUploadBundle {
    public static void main(String[] args) {
        try {
            if (args.length != 2 || !args[1].matches("(?i)[0-9a-f]{64}"))
                throw new IllegalArgumentException();
            String expected = args[1].toLowerCase(Locale.ROOT);
            int payloadEntries = 0;
            var names = new HashSet<String>();
            byte[] buffer = new byte[65536];
            try (var jar = new JarFile(Path.of(args[0]).toFile(), true)) {
                var entries = jar.entries();
                while (entries.hasMoreElements()) {
                    var entry = entries.nextElement();
                    String name = entry.getName();
                    if (!names.add(name)) throw new SecurityException();
                    if (entry.isDirectory()) continue;
                    // Verification is lazy: every byte must be read first.
                    try (InputStream input = jar.getInputStream(entry)) {
                        while (input.read(buffer) != -1) { }
                    }
                    String upper = name.toUpperCase(Locale.ROOT);
                    if (upper.equals("META-INF/MANIFEST.MF") ||
                        upper.matches("META-INF/[^/]+\\.(SF|RSA|DSA|EC)")) continue;
                    CodeSigner[] signers = entry.getCodeSigners();
                    if (signers == null || signers.length != 1) throw new SecurityException();
                    var certificate = (X509Certificate) signers[0].getSignerCertPath().getCertificates().get(0);
                    certificate.checkValidity();
                    String actual = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(certificate.getEncoded()));
                    if (!actual.equals(expected)) throw new SecurityException();
                    if (!(certificate.getPublicKey() instanceof RSAPublicKey rsa) ||
                        rsa.getModulus().bitLength() < 3072) throw new SecurityException();
                    if (certificate.getSubjectX500Principal().getName().toLowerCase(Locale.ROOT).contains("android debug"))
                        throw new SecurityException();
                    payloadEntries++;
                }
            }
            if (payloadEntries == 0) throw new SecurityException();
            System.out.println("{\"signatureVerified\":true,\"signedEntries\":" + payloadEntries +
                ",\"uploadCertificateSha256\":\"" + expected + "\"}");
        } catch (Exception error) {
            // No certificate subjects, local paths or stack traces in logs.
            System.err.println("Upload signature verification failed.");
            System.exit(1);
        }
    }
}
