export default interface DOMEventInterface<T extends EventTarget> extends Event
{
	readonly target: T,
	readonly currentTarget: T
};