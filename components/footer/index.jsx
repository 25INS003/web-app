export default function Footer() {
    return (
        <footer className="py-8 border-t text-center text-muted-foreground">
            <div className="container mx-auto">
                <p>© {new Date().getFullYear()} NAVRobotic.</p>
            </div>
        </footer>
    );
}